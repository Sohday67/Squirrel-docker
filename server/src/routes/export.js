const express = require('express');
const { Spending, Category, Return } = require('../models');
const authenticate = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/export/json
router.get('/json', async (req, res) => {
  try {
    const [categories, spendings, returns] = await Promise.all([
      Category.findAll({ where: { userId: req.user.id }, order: [['name', 'ASC']] }),
      Spending.findAll({
        where: { userId: req.user.id },
        include: [{ model: Category, attributes: ['name'] }],
        order: [['date', 'DESC']],
      }),
      Return.findAll({ where: { userId: req.user.id }, order: [['date', 'DESC']] }),
    ]);

    return res.json({
      success: true,
      data: { categories, spendings, returns, exportedAt: new Date().toISOString() },
    });
  } catch (err) {
    console.error('Export JSON error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/export/csv
router.get('/csv', async (req, res) => {
  try {
    const spendings = await Spending.findAll({
      where: { userId: req.user.id },
      include: [{ model: Category, attributes: ['name'] }],
      order: [['date', 'DESC']],
      raw: true,
      nest: true,
    });

    const header = 'id,date,amount,amountUSD,currency,category,comment,place,timeZoneIdentifier';
    const rows = spendings.map((s) => {
      const fields = [
        s.id,
        s.date,
        s.amount,
        s.amountUSD,
        s.currency,
        s.Category ? s.Category.name : '',
        csvEscape(s.comment),
        csvEscape(s.place),
        s.timeZoneIdentifier || '',
      ];
      return fields.join(',');
    });

    const csv = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="squirrel-export.csv"');
    return res.send(csv);
  } catch (err) {
    console.error('Export CSV error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

function csvEscape(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

module.exports = router;
