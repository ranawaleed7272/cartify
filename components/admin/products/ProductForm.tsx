import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Product } from '@/models/Product'; // Assuming you have a Product type/interface
import { getCategories, getAllBrands } from '@/lib/api'; // Assuming these functions exist

interface ProductFormProps {
  initialData?: Product; // For editing existing products
  onSuccess: () => void; // Callback after successful submission
}

const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSuccess }) => {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<Product>>(initialData || {});
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedCategories = await getCategories();
        setCategories(fetchedCategories);
        const fetchedBrands = await getAllBrands();
        setBrands(fetchedBrands);
      } catch (err) {
        console.error("Failed to fetch categories or brands:", err);
        setError("Failed to load form data.");
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleCouponChange = (field: string, value: string | number) => {
    setFormData({
      ...formData,
      coupon: {
        ...formData.coupon,
        [field]: value,
      },
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const currentImagesCount = formData.images?.length || 0;
      const remainingSlots = 5 - currentImagesCount;

      if (remainingSlots <= 0) {
        toast.error("You can upload a maximum of 5 images.");
        return;
      }

      const filesToUpload = files.slice(0, remainingSlots);

      setLoading(true);
      setError(null);

      try {
        const uploadedUrls: string[] = [];
        for (const file of filesToUpload) {
          const uploadFormData = new FormData();
          uploadFormData.append('file', file);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload image');
          }

          const result = await response.json();
          uploadedUrls.push(result.secure_url);
        }

        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), ...uploadedUrls],
        }));
        toast.success(`${uploadedUrls.length} image(s) uploaded successfully!`);
      } catch (err: any) {
        setError(err.message);
        toast.error(`Image upload failed: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, index) => index !== indexToRemove),
    }));
    toast.success("Image removed.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const values = formData;
      
      // Validate required fields
      if (!values.description || values.description.trim() === '') {
        toast.error('Description is required');
        setError('Description is required');
        setLoading(false);
        return;
      }
      
      if (!values.images || values.images.length === 0) {
        toast.error('At least one image is required');
        setError('At least one image is required');
        setLoading(false);
        return;
      }
      
      const price = values.originalPrice - (values.originalPrice * (values.discount || 0)) / 100;

      const productData = {
        ...values,
        price: price,
      };

      const isEditing = !!values._id;
      // Update by ID using query param so it hits pages/api/products/index.js PUT handler
      const apiUrl = isEditing ? `/api/products?id=${encodeURIComponent(String(values._id))}` : '/api/products';
      const httpMethod = isEditing ? 'PUT' : 'POST';

      const response = await axios({
        url: apiUrl,
        method: httpMethod,
        data: productData,
      });

      toast.success(isEditing ? 'Product updated.' : 'Product created.');
      onSuccess();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to save product';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error saving product:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow-md">
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
          <input type="text" id="name" name="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input type="text" id="slug" name="slug" value={formData.slug || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} rows={4} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-700 mb-1">Original Price</label>
          <input type="number" id="originalPrice" name="originalPrice" value={formData.originalPrice || 0} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
          <input type="number" id="discount" name="discount" value={formData.discount || 0} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>
      <div>
        <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
        <input type="text" id="sku" name="sku" value={formData.sku || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>
      <div>
        <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-1">Images * ({formData.images?.length || 0}/5 - At least 1 required)</label>
        <input 
          type="file" 
          id="images" 
          name="images" 
          onChange={handleImageChange} 
          multiple 
          className="mt-1 block w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={(formData.images?.length || 0) >= 5}
        />
        {(formData.images && formData.images.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.images.map((img, index) => (
              <div key={index} className="relative w-20 h-20 group">
                <img src={img} alt={`Product Image ${index + 1}`} className="w-full h-full object-cover rounded-md border border-gray-200 shadow-sm" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  title="Remove image"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select id="category" name="category" value={formData.category || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
          <select id="brand" name="brand" value={formData.brand || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">Select a brand</option>
            {brands.map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
          <input type="number" id="stock" name="stock" value={formData.stock || 0} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select id="status" name="status" value={formData.status || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">Select status</option>
            <option value="Hot">Hot</option>
            <option value="New">New</option>
            <option value="Sale">Sale</option>
            <option value="Ending">Ending</option>
            <option value="Last Piece">Last Piece</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="variant" className="block text-sm font-medium text-gray-700 mb-1">Variant</label>
        <input type="text" id="variant" name="variant" value={formData.variant || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>
      <div className="flex items-center mt-4">
        <input type="checkbox" id="isFeatured" name="isFeatured" checked={formData.isFeatured || false} onChange={handleChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
        <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900">Featured Product</label>
      </div>
      <div className="flex items-center mt-2">
        <input type="checkbox" id="isOnDeal" name="isOnDeal" checked={formData.isOnDeal || false} onChange={handleChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
        <label htmlFor="isOnDeal" className="ml-2 block text-sm text-gray-900">On Deal</label>
      </div>
      {formData.isOnDeal && (
        <div className="mt-4">
          <label htmlFor="dealPercentage" className="block text-sm font-medium text-gray-700 mb-1">Deal Percentage (%)</label>
          <input type="number" id="dealPercentage" name="dealPercentage" value={formData.dealPercentage || 0} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
      )}
      
      {/* Coupon Section */}
      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Product Coupon</h3>
        <p className="text-sm text-gray-600 mb-4">Add a coupon code that customers can use for this specific product. Leave empty if no coupon is available.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="couponName" className="block text-sm font-medium text-gray-700 mb-1">Coupon Name/Code</label>
            <input 
              type="text" 
              id="couponName" 
              placeholder="e.g., SUMMER20" 
              value={formData.coupon?.name || ''} 
              onChange={(e) => handleCouponChange('name', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div>
            <label htmlFor="couponValue" className="block text-sm font-medium text-gray-700 mb-1">Discount Percentage (%)</label>
            <input 
              type="number" 
              id="couponValue" 
              min="0" 
              max="100" 
              placeholder="e.g., 20" 
              value={formData.coupon?.value || ''} 
              onChange={(e) => handleCouponChange('value', parseInt(e.target.value) || 0)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
        </div>
        {formData.coupon?.name && formData.coupon?.value && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              <strong>Preview:</strong> Customers can use coupon "{formData.coupon.name}" to get {formData.coupon.value}% off this product.
            </p>
          </div>
        )}
      </div>
      
      <button type="submit" disabled={loading} className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed">
        {loading ? 'Saving...' : initialData ? 'Update Product' : 'Add Product'}
      </button>
    </form>
  );
};

export default ProductForm;
