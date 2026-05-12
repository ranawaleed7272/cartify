import { createRouter } from 'next-connect';
import dbConnect from '../../../lib/db';
import Product from '../../../models/Product';
import Category from '../../../models/Category'; // Category model zaroori hai
import Brand from '../../../models/Brand';     // Brand model zaroori hai

const router = createRouter();

// 1. GET ROUTE: Products ko fetch, search aur sort karne ke liye
router.get(async (req, res) => {
  await dbConnect();
  try {
    const { searchTerm, isFeatured, isOnDeal, category, sort } = req.query;
    let query = {};

    // Search Logic
    if (searchTerm) {
      query = {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
        ],
      };
    }

    if (isFeatured === 'true') {
      query = { ...query, isFeatured: true };
    }

    if (isOnDeal === 'true') {
      query = { ...query, isOnDeal: true };
    }

    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        query = { ...query, category: categoryDoc._id };
      }
    }

    // Naya Sorting Logic (Low to High / High to Low)
    let sortOptions = {};
    if (sort === 'priceLowToHigh') {
      sortOptions = { price: 1 }; // Sasta pehle
    } else if (sort === 'priceHighToLow') {
      sortOptions = { price: -1 }; // Mehenga pehle
    } else {
      sortOptions = { createdAt: -1 }; // Default: Latest products
    }

    const products = await Product.find(query)
      .populate('category')
      .populate('brand')
      .sort(sortOptions); 

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
})

// 2. POST ROUTE: Naya product banane ke liye (Waisa hi rakha hai)
.post(async (req, res) => {
  await dbConnect();
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: 'Failed to create product' });
  }
})

// 3. PUT ROUTE: Product update karne ke liye
.put(async (req, res) => {
  await dbConnect();
  try {
    const { id } = req.query;
    const product = await Product.findByIdAndUpdate(id, req.body, { new: true });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

export default router.handler({
  onError: (err, req, res) => {
    console.error(err.stack);
    res.status(500).end('Something broke!');
  },
  onNoMatch: (req, res) => {
    res.status(404).end('Page is not found');
  },
});