import { Request, Response } from 'express';
import { readDB, writeDB } from '../db';
import { Product } from '../../src/types';

export const getAllProducts = (req: Request, res: Response) => {
  try {
    const db = readDB();
    let products = [...db.products];

    // Filter by category slug
    const categorySlug = req.query.category as string;
    if (categorySlug) {
      const category = db.categories.find(c => c.slug === categorySlug);
      if (category) {
        products = products.filter(p => p.categoryId === category.id);
      } else {
        products = []; // Category not found
      }
    }

    // Filter by featured
    const isFeatured = req.query.featured as string;
    if (isFeatured === 'true') {
      products = products.filter(p => p.isFeatured);
    }

    // Filter by search text
    const search = req.query.search as string;
    if (search) {
      const query = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query) ||
        (p.details && p.details.brand.toLowerCase().includes(query))
      );
    }

    // Sort products (e.g., price high-to-low, low-to-high, best-rated)
    const sortBy = req.query.sortBy as string;
    if (sortBy === 'price_asc') {
      products.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
    } else if (sortBy === 'price_desc') {
      products.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
    } else if (sortBy === 'rating') {
      products.sort((a, b) => b.rating - a.rating);
    }

    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve products: ' + err.message });
  }
};

export const getProductById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = readDB();
    const product = db.products.find(p => p.id === id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Get approved reviews for this product
    const reviews = db.reviews.filter(r => r.productId === id && r.isApproved);

    res.json({
      product,
      reviews
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve product details: ' + err.message });
  }
};

export const createProduct = (req: Request, res: Response) => {
  try {
    const { name, description, price, salePrice, stock, categoryId, isFeatured, brand, skinType, ingredients, howToUse, imageUrl, rewardCoins } = req.body;

    if (!name || !description || price === undefined || stock === undefined || !categoryId) {
      return res.status(400).json({ error: 'Name, description, price, stock, and category are required.' });
    }

    const db = readDB();

    // Verify category exists
    const category = db.categories.find(c => c.id === categoryId);
    if (!category) {
      return res.status(400).json({ error: 'Invalid category selection.' });
    }

    // Resolve Image URL: can use either uploaded file path or raw URL
    let finalImageUrl = imageUrl || 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=400';
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newProduct: Product = {
      id: 'prod_' + Date.now(),
      name,
      slug,
      description,
      price: Number(price),
      salePrice: salePrice ? Number(salePrice) : undefined,
      stock: Number(stock),
      categoryId,
      categoryName: category.name,
      image: finalImageUrl,
      rating: 5.0, // default rating for new items
      reviewsCount: 0,
      isFeatured: isFeatured === true || isFeatured === 'true',
      rewardCoins: rewardCoins !== undefined ? Number(rewardCoins) : 0,
      details: {
        brand: brand || 'Beauty Point Collection',
        skinType: skinType || 'All Skin Types',
        ingredients: ingredients || 'Cruelty-free, premium, pure elements.',
        howToUse: howToUse || 'Apply as desired on clean skin.'
      }
    };

    db.products.push(newProduct);
    writeDB(db);

    res.status(201).json({
      message: 'Product created successfully!',
      product: newProduct
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create product: ' + err.message });
  }
};

export const updateProduct = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, salePrice, stock, categoryId, isFeatured, brand, skinType, ingredients, howToUse, imageUrl, rewardCoins } = req.body;

    const db = readDB();
    const productIndex = db.products.findIndex(p => p.id === id);

    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const currentProduct = db.products[productIndex];

    // If changing category, verify new category
    let categoryName = currentProduct.categoryName;
    if (categoryId && categoryId !== currentProduct.categoryId) {
      const category = db.categories.find(c => c.id === categoryId);
      if (!category) {
        return res.status(400).json({ error: 'Invalid category selection.' });
      }
      categoryName = category.name;
    }

    // Resolve Image URL
    let finalImageUrl = imageUrl || currentProduct.image;
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    const updatedProduct: Product = {
      ...currentProduct,
      name: name || currentProduct.name,
      slug: name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : currentProduct.slug,
      description: description || currentProduct.description,
      price: price !== undefined ? Number(price) : currentProduct.price,
      salePrice: salePrice !== undefined ? (salePrice === '' ? undefined : Number(salePrice)) : currentProduct.salePrice,
      stock: stock !== undefined ? Number(stock) : currentProduct.stock,
      categoryId: categoryId || currentProduct.categoryId,
      categoryName,
      image: finalImageUrl,
      isFeatured: isFeatured !== undefined ? (isFeatured === true || isFeatured === 'true') : currentProduct.isFeatured,
      rewardCoins: rewardCoins !== undefined ? Number(rewardCoins) : currentProduct.rewardCoins,
      details: {
        brand: brand || currentProduct.details?.brand || 'Beauty Point Collection',
        skinType: skinType || currentProduct.details?.skinType || 'All Skin Types',
        ingredients: ingredients || currentProduct.details?.ingredients || 'Cruelty-free, premium, pure elements.',
        howToUse: howToUse || currentProduct.details?.howToUse || 'Apply as desired.'
      }
    };

    db.products[productIndex] = updatedProduct;
    writeDB(db);

    res.json({
      message: 'Product updated successfully!',
      product: updatedProduct
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update product: ' + err.message });
  }
};

export const deleteProduct = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = readDB();

    const productIndex = db.products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Remove product
    db.products.splice(productIndex, 1);

    // Also remove reviews related to this product
    db.reviews = db.reviews.filter(r => r.productId !== id);

    writeDB(db);

    res.json({ message: 'Product and related reviews deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete product: ' + err.message });
  }
};

export const bulkUpdateRewards = (req: Request, res: Response) => {
  try {
    const { productIds, categoryId, method, value } = req.body;

    if (method === undefined || value === undefined) {
      return res.status(400).json({ error: 'Method and value parameters are required.' });
    }

    const db = readDB();
    const valNum = Number(value);

    let updatedCount = 0;
    db.products = db.products.map(prod => {
      // Filter category if provided
      if (categoryId && prod.categoryId !== categoryId) {
        return prod;
      }
      // Filter list of productIds if provided
      if (productIds && Array.isArray(productIds) && !productIds.includes(prod.id)) {
        return prod;
      }

      let newCoins = prod.rewardCoins || 0;
      const refPrice = prod.salePrice || prod.price;

      if (method === 'flat') {
        newCoins = Math.max(0, Math.round(valNum));
      } else if (method === 'multiply') {
        newCoins = Math.max(0, Math.round(newCoins * valNum));
      } else if (method === 'percent_price') {
        newCoins = Math.max(0, Math.round((refPrice * valNum) / 100));
      }

      updatedCount++;
      return {
        ...prod,
        rewardCoins: newCoins
      };
    });

    writeDB(db);

    res.json({
      message: `Successfully bulk updated reward coins for ${updatedCount} products.`,
      updatedCount
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to bulk update reward coins: ' + err.message });
  }
};
