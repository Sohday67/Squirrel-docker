const express = require('express');
const { Category } = require('../models');
const authenticate = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { userId: req.user.id },
      order: [['name', 'ASC']],
    });
    return res.json({ success: true, data: categories });
  } catch (err) {
    console.error('List categories error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/categories
router.post('/', async (req, res) => {
  try {
    const { id, name, color, isShadowed, isFavorite } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'name is required' });
    }

    const data = { userId: req.user.id, name, color, isShadowed, isFavorite };
    if (id) data.id = id;

    const category = await Category.create(data);
    return res.status(201).json({ success: true, data: category });
  } catch (err) {
    console.error('Create category error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/categories/:id
router.put('/:id', async (req, res) => {
  try {
    const category = await Category.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const { name, color, isShadowed, isFavorite } = req.body;
    await category.update({ name, color, isShadowed, isFavorite });

    return res.json({ success: true, data: category });
  } catch (err) {
    console.error('Update category error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    await category.destroy();
    return res.json({ success: true, data: { message: 'Category deleted' } });
  } catch (err) {
    console.error('Delete category error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/categories/sync - Bulk upsert
router.post('/sync', async (req, res) => {
  try {
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      return res.status(400).json({ success: false, error: 'categories array is required' });
    }

    const results = [];
    for (const item of categories) {
      const { id, name, color, isShadowed, isFavorite } = item;

      if (!id || !name) {
        results.push({ id, error: 'Missing required fields' });
        continue;
      }

      const [category] = await Category.upsert(
        { id, userId: req.user.id, name, color, isShadowed, isFavorite },
        { returning: true }
      );
      results.push(category);
    }

    return res.json({ success: true, data: results });
  } catch (err) {
    console.error('Sync categories error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
