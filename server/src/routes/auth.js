const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { User } = require('../models');
const authenticate = require('../middleware/auth');

const router = express.Router();
const BCRYPT_ROUNDS = 12;
const JWT_EXPIRY = '7d';

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'Username, email, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Username already taken' });
    }
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({ username, email, passwordHash });
    const token = generateToken(user.id);

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, email: user.email, twoFactorEnabled: user.twoFactorEnabled },
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (user.twoFactorEnabled) {
      // Return a temporary token that only allows 2FA verification
      const tempToken = jwt.sign({ userId: user.id, pending2FA: true }, process.env.JWT_SECRET, { expiresIn: '5m' });
      return res.json({
        success: true,
        data: { requires2FA: true, tempToken },
      });
    }

    const token = generateToken(user.id);
    return res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, email: user.email, twoFactorEnabled: user.twoFactorEnabled },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/verify-2fa
router.post('/verify-2fa', async (req, res) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({ success: false, error: 'Temporary token and TOTP code are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid or expired temporary token' });
    }

    if (!decoded.pending2FA) {
      return res.status(400).json({ success: false, error: 'Invalid token type' });
    }

    const user = await User.findByPk(decoded.userId);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ success: false, error: '2FA not configured' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) {
      return res.status(401).json({ success: false, error: 'Invalid TOTP code' });
    }

    const token = generateToken(user.id);
    return res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, username: user.username, email: user.email, twoFactorEnabled: user.twoFactorEnabled },
      },
    });
  } catch (err) {
    console.error('Verify 2FA error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/setup-2fa
router.post('/setup-2fa', authenticate, async (req, res) => {
  try {
    if (req.user.twoFactorEnabled) {
      return res.status(400).json({ success: false, error: '2FA is already enabled' });
    }

    const secret = speakeasy.generateSecret({
      name: `Squirrel:${req.user.username}`,
      issuer: 'Squirrel',
    });

    // Store the secret temporarily (not enabled yet)
    await req.user.update({ twoFactorSecret: secret.base32 });

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    return res.json({
      success: true,
      data: {
        secret: secret.base32,
        otpauthUrl: secret.otpauth_url,
        qrCode: qrCodeDataUrl,
      },
    });
  } catch (err) {
    console.error('Setup 2FA error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/enable-2fa
router.post('/enable-2fa', authenticate, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, error: 'TOTP code is required' });
    }

    if (!req.user.twoFactorSecret) {
      return res.status(400).json({ success: false, error: 'Run setup-2fa first' });
    }

    const verified = speakeasy.totp.verify({
      secret: req.user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ success: false, error: 'Invalid TOTP code' });
    }

    await req.user.update({ twoFactorEnabled: true });

    return res.json({
      success: true,
      data: { message: '2FA enabled successfully' },
    });
  } catch (err) {
    console.error('Enable 2FA error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/disable-2fa
router.post('/disable-2fa', authenticate, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, error: 'TOTP code is required' });
    }

    if (!req.user.twoFactorEnabled || !req.user.twoFactorSecret) {
      return res.status(400).json({ success: false, error: '2FA is not enabled' });
    }

    const verified = speakeasy.totp.verify({
      secret: req.user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) {
      return res.status(401).json({ success: false, error: 'Invalid TOTP code' });
    }

    await req.user.update({ twoFactorEnabled: false, twoFactorSecret: null });

    return res.json({
      success: true,
      data: { message: '2FA disabled successfully' },
    });
  } catch (err) {
    console.error('Disable 2FA error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  return res.json({
    success: true,
    data: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      twoFactorEnabled: req.user.twoFactorEnabled,
      createdAt: req.user.createdAt,
    },
  });
});

module.exports = router;
