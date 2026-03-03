const express = require('express');
const { Op } = require('sequelize');
const { Spending, Category } = require('../models');
const authenticate = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/spendings
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate } = req.query;
    const where = { userId: req.user.id };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const { count, rows } = await Spending.findAndCountAll({
      where,
      include: [{ model: Category, attributes: ['id', 'name', 'color'] }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset,
    });

    return res.json({
      success: true,
      data: { spendings: rows, total: count, page: parseInt(page, 10), totalPages: Math.ceil(count / parseInt(limit, 10)) },
    });
  } catch (err) {
    console.error('List spendings error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/spendings
router.post('/', async (req, res) => {
  try {
    const { id, amount, amountUSD, currency, categoryId, comment, place, date, timeZoneIdentifier } = req.body;

    if (amount == null || amountUSD == null || !currency || !date) {
      return res.status(400).json({ success: false, error: 'amount, amountUSD, currency, and date are required' });
    }

    const data = { userId: req.user.id, amount, amountUSD, currency, categoryId, comment, place, date, timeZoneIdentifier };
    if (id) data.id = id;

    const spending = await Spending.create(data);
    return res.status(201).json({ success: true, data: spending });
  } catch (err) {
    console.error('Create spending error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/spendings/:id
router.put('/:id', async (req, res) => {
  try {
    const spending = await Spending.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!spending) {
      return res.status(404).json({ success: false, error: 'Spending not found' });
    }

    const { amount, amountUSD, currency, categoryId, comment, place, date, timeZoneIdentifier } = req.body;
    await spending.update({ amount, amountUSD, currency, categoryId, comment, place, date, timeZoneIdentifier });

    return res.json({ success: true, data: spending });
  } catch (err) {
    console.error('Update spending error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/spendings/:id
router.delete('/:id', async (req, res) => {
  try {
    const spending = await Spending.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!spending) {
      return res.status(404).json({ success: false, error: 'Spending not found' });
    }

    await spending.destroy();
    return res.json({ success: true, data: { message: 'Spending deleted' } });
  } catch (err) {
    console.error('Delete spending error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/spendings/sync - Bulk upsert
router.post('/sync', async (req, res) => {
  try {
    const { spendings } = req.body;

    if (!Array.isArray(spendings)) {
      return res.status(400).json({ success: false, error: 'spendings array is required' });
    }

    const results = [];
    for (const item of spendings) {
      const { id, amount, amountUSD, currency, categoryId, comment, place, date, timeZoneIdentifier } = item;

      if (!id || amount == null || amountUSD == null || !currency || !date) {
        results.push({ id, error: 'Missing required fields' });
        continue;
      }

      const [spending] = await Spending.upsert(
        { id, userId: req.user.id, amount, amountUSD, currency, categoryId, comment, place, date, timeZoneIdentifier },
        { returning: true }
      );
      results.push(spending);
    }

    return res.json({ success: true, data: results });
  } catch (err) {
    console.error('Sync spendings error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
