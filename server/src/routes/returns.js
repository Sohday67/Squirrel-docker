const express = require('express');
const { Return, Spending } = require('../models');
const authenticate = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/returns
router.get('/', async (req, res) => {
  try {
    const returns = await Return.findAll({
      where: { userId: req.user.id },
      include: [{ model: Spending, attributes: ['id', 'amount', 'currency', 'comment'] }],
      order: [['date', 'DESC']],
    });
    return res.json({ success: true, data: returns });
  } catch (err) {
    console.error('List returns error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/returns
router.post('/', async (req, res) => {
  try {
    const { id, spendingId, amount, amountUSD, currency, name, date } = req.body;

    if (amount == null || amountUSD == null || !currency || !date) {
      return res.status(400).json({ success: false, error: 'amount, amountUSD, currency, and date are required' });
    }

    const data = { userId: req.user.id, spendingId, amount, amountUSD, currency, name, date };
    if (id) data.id = id;

    const ret = await Return.create(data);
    return res.status(201).json({ success: true, data: ret });
  } catch (err) {
    console.error('Create return error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/returns/:id
router.put('/:id', async (req, res) => {
  try {
    const ret = await Return.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!ret) {
      return res.status(404).json({ success: false, error: 'Return not found' });
    }

    const { spendingId, amount, amountUSD, currency, name, date } = req.body;
    await ret.update({ spendingId, amount, amountUSD, currency, name, date });

    return res.json({ success: true, data: ret });
  } catch (err) {
    console.error('Update return error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/returns/:id
router.delete('/:id', async (req, res) => {
  try {
    const ret = await Return.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!ret) {
      return res.status(404).json({ success: false, error: 'Return not found' });
    }

    await ret.destroy();
    return res.json({ success: true, data: { message: 'Return deleted' } });
  } catch (err) {
    console.error('Delete return error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/returns/sync - Bulk upsert
router.post('/sync', async (req, res) => {
  try {
    const { returns } = req.body;

    if (!Array.isArray(returns)) {
      return res.status(400).json({ success: false, error: 'returns array is required' });
    }

    const results = [];
    for (const item of returns) {
      const { id, spendingId, amount, amountUSD, currency, name, date } = item;

      if (!id || amount == null || amountUSD == null || !currency || !date) {
        results.push({ id, error: 'Missing required fields' });
        continue;
      }

      const [ret] = await Return.upsert(
        { id, userId: req.user.id, spendingId, amount, amountUSD, currency, name, date },
        { returning: true }
      );
      results.push(ret);
    }

    return res.json({ success: true, data: results });
  } catch (err) {
    console.error('Sync returns error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
