"use client";

import React, { useState, useEffect, useMemo } from 'react';
import ProductCard from '@/components/common/ProductCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Filter, X, ChevronDown, ChevronUp, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useRouter } from 'next/navigation';

// --- Types ---
type Product = {
  _id: string;
  name: string;
  slug: { current: string };
  description?: string;
  images?: any[];
  originalPrice: number;
  discount?: number;
  sku: string;
  stock: number;
  status?: string;
  category?: { _id: string; name: string; slug: { current: string }; };
  brand?: { _id: string; name: string; slug: { current: string }; };
  featured?: boolean;
  isOnDeal?: boolean;
};

type Category = { _id: string; name: string; slug: { current: string }; productCount?: number; };
type Brand = { _id: string; name: string; slug: { current: string }; };
type SortOption = 'newest' | 'price-low-high' | 'price-high-low' | 'name-a-z' | 'name-z-a';

interface ShopPageClientProps {
  initialProducts: Product[];
  initialCategories: Category[];
  initialBrands: Brand[];
  preSelectedBrandSlug?: string;
  preSelectedCategorySlug?: string;
}

const PRODUCTS_PER_PAGE = 20;

const ShopPageClient = ({ initialProducts, initialCategories, initialBrands, preSelectedBrandSlug, preSelectedCategorySlug }: ShopPageClientProps) => {
  const router = useRouter();
  
  // States
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  
  // Filter States
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [currentPage, setCurrentPage] = useState(1);

  // UI States
  const [showFilters, setShowFilters] = useState(false);

  // --- API Fetching Logic (Search & Sort) ---
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      setLoading(true);
      try {
        // Map frontend sort types to backend sort types
        let backendSort = 'newest';
        if (sortBy === 'price-low-high') backendSort = 'priceLowToHigh';
        if (sortBy === 'price-high-low') backendSort = 'priceHighToLow';

        const query = new URLSearchParams({
          searchTerm: searchTerm,
          sort: backendSort,
        });

        // Add category if selected
        if (selectedCategories.length > 0) {
          query.append('categoryIds', selectedCategories.join(','));
        }

        const res = await fetch(`/api/products?${query.toString()}`);
        const data = await res.json();
        
        if (Array.isArray(data)) {
          setProducts(data);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search to avoid too many API calls
    const delayDebounceFn = setTimeout(() => {
      fetchFilteredProducts();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, sortBy, selectedCategories, selectedBrands]);

  // Frontend local filtering for Price/Stock (as they are fast)
  const finalDisplayProducts = useMemo(() => {
    return products.filter(p => p.originalPrice >= priceRange[0] && p.originalPrice <= priceRange[1]);
  }, [products, priceRange]);

  const totalPages = Math.ceil(finalDisplayProducts.length / PRODUCTS_PER_PAGE);
  const currentProducts = finalDisplayProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  return (
    <div className="mt-6 px-4 md:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Explore Products</h1>
          <p className="text-gray-500">Find the best tech deals for your needs</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Search Bar - Feature 1 */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Search by name..." 
              className="pl-10 border-gray-300 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button variant="outline" className="md:hidden" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <aside className={`w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden md:block'} space-y-6`}>
          <Card>
            <CardHeader><CardTitle className="text-sm">Price Filter</CardTitle></CardHeader>
            <CardContent>
              <Slider 
                max={500000} 
                step={1000} 
                value={priceRange} 
                onValueChange={(v) => setPriceRange(v as [number, number])} 
              />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Rs. {priceRange[0]}</span>
                <span>Rs. {priceRange[1]}</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Categories */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Categories</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {initialCategories.slice(0, 8).map(cat => (
                <div key={cat._id} className="flex items-center gap-2">
                  <Checkbox 
                    id={cat._id} 
                    onCheckedChange={(checked) => {
                      if(checked) setSelectedCategories([...selectedCategories, cat._id]);
                      else setSelectedCategories(selectedCategories.filter(id => id !== cat._id));
                    }}
                  />
                  <Label htmlFor={cat._id} className="text-sm cursor-pointer">{cat.name}</Label>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>

        {/* Product Listing Area */}
        <main className="flex-1">
          <div className="flex items-center justify-between mb-6 bg-gray-50 p-4 rounded-lg">
            <span className="text-sm text-gray-600 font-medium">
              {loading ? 'Refreshing...' : `Showing ${finalDisplayProducts.length} Results`}
            </span>

            {/* Sort Dropdown - Feature 2 */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 whitespace-nowrap">Sort by:</span>
              <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
                <SelectTrigger className="w-44 bg-white">
                  <SelectValue placeholder="Newest" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                  <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                  <SelectItem value="name-a-z">Name: A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-80 bg-gray-200 rounded-xl" />)}
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {currentProducts.length === 0 && !loading && (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed">
              <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-700">No products found</h2>
              <p className="text-gray-500">Try changing your search or filters.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ShopPageClient;
