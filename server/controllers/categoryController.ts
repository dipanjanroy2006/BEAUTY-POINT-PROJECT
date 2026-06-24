import { Request, Response } from 'express';
import { readDB, writeDB } from '../db';
import { Category } from '../../src/types';

export const getAllCategories = (req: Request, res: Response) => {
  try {
    const db = readDB();
    res.json(db.categories);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve categories: ' + err.message });
  }
};

export const createCategory = (req: Request, res: Response) => {
  try {
    const { name, description, imageUrl } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Category name and description are required.' });
    }

    const db = readDB();

    // Check if category name exists
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existing = db.categories.find(c => c.slug === slug);
    if (existing) {
      return res.status(400).json({ error: 'A category with this name already exists.' });
    }

    // Handle image file or manual link
    let finalImageUrl = imageUrl || 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=400';
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    const newCategory: Category = {
      id: 'cat_' + Date.now(),
      name,
      slug,
      description,
      image: finalImageUrl
    };

    db.categories.push(newCategory);
    writeDB(db);

    res.status(201).json({
      message: 'Category created successfully!',
      category: newCategory
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create category: ' + err.message });
  }
};

export const deleteCategory = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = readDB();

    const categoryIndex = db.categories.findIndex(c => c.id === id);
    if (categoryIndex === -1) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Find if there are products attached to this category
    const productsInCat = db.products.filter(p => p.categoryId === id);
    if (productsInCat.length > 0) {
      return res.status(400).json({
        error: `Cannot delete category. There are ${productsInCat.length} products associated with this category. Please delete or re-assign those products first.`
      });
    }

    db.categories.splice(categoryIndex, 1);
    writeDB(db);

    res.json({ message: 'Category deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete category: ' + err.message });
  }
};
