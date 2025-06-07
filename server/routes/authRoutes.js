const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, role } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin đăng ký.' });
    }

    // Chỉ admin được phép tạo admin
    if (role && role === 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có thể tạo tài khoản admin.' });
    }

    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Email đã tồn tại.' });
      }
      return res.status(400).json({ error: 'Tên người dùng đã tồn tại.' });
    }

    const user = new User({ email, username, password, role: role || 'user' });
    await user.save();

    res.json({ message: 'Đăng ký thành công!' });
  } catch (err) {
    console.error('Error in POST /api/auth/register:', err.message, err.stack);
    res.status(500).json({ error: 'Lỗi khi đăng ký.', details: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng cung cấp email và mật khẩu.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
    }

    const token = jwt.sign({ 
      userId: user._id, 
      role: user.role,
      username: user.username,
      email: user.email
    }, JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ 
      message: 'Đăng nhập thành công!', 
      token, 
      role: user.role,
      username: user.username
    });
  } catch (err) {
    console.error('Error in POST /api/auth/login:', err.message, err.stack);
    res.status(500).json({ error: 'Lỗi khi đăng nhập.', details: err.message });
  }
});

// GET /api/auth/users - Lấy danh sách người dùng (chỉ dành cho admin)
router.get('/users', authMiddleware(['admin']), async (req, res) => {
  try {
    const users = await User.find({}, 'email username role debtAmount');
    res.json(users);
  } catch (err) {
    console.error('Error in GET /api/auth/users:', err.message, err.stack);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách người dùng.' });
  }
});

// PUT /api/auth/users/:id/debt - Cập nhật số tiền nợ (chỉ dành cho admin)
router.put('/users/:id/debt', authMiddleware(['admin']), async (req, res) => {
  try {
    const { debtAmount } = req.body;
    
    if (debtAmount < 0) {
      return res.status(400).json({ error: 'Số tiền nợ không được âm.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { debtAmount: debtAmount },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    res.json({ message: 'Cập nhật số tiền nợ thành công!', data: user });
  } catch (err) {
    console.error('Error in PUT /api/auth/users/:id/debt:', err.message, err.stack);
    res.status(500).json({ error: 'Lỗi khi cập nhật số tiền nợ.' });
  }
});

// DELETE /api/auth/users/:id - Xóa người dùng (chỉ dành cho admin)
router.delete('/users/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Không cho phép xóa chính mình
    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'Không thể xóa tài khoản của chính mình.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại.' });
    }

    await User.findByIdAndDelete(userId);
    res.json({ message: 'Xóa người dùng thành công!' });
  } catch (err) {
    console.error('Error in DELETE /api/auth/users/:id:', err.message, err.stack);
    res.status(500).json({ error: 'Lỗi khi xóa người dùng.' });
  }
});

module.exports = router;