const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const DebtHistory = require('../models/DebtHistory');

// Lấy lịch sử nợ của người dùng
router.get('/users/:userId/debt-history', auth(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    const history = await DebtHistory.find({ userId })
      .sort({ date: -1 });

    res.json(history);
  } catch (err) {
    console.error('Error fetching debt history:', err);
    res.status(500).json({ error: 'Lỗi khi lấy lịch sử nợ' });
  }
});

// Cập nhật số tiền nợ của người dùng
router.post('/users/:userId/debt', auth(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { debtAmount, newDebtAmount, note } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    if (typeof debtAmount !== 'number' || debtAmount < 0) {
      return res.status(400).json({ error: 'Số tiền nợ không hợp lệ' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    const oldDebtAmount = user.debtAmount || 0;
    const changeAmount = newDebtAmount || (debtAmount - oldDebtAmount);

    // Cập nhật số tiền nợ
    user.debtAmount = debtAmount;
    user.lastDebtUpdate = new Date();
    await user.save();

    // Lưu lịch sử thay đổi
    await DebtHistory.create({
      userId,
      date: new Date(),
      amount: debtAmount,
      changeAmount: Math.abs(changeAmount),
      type: changeAmount > 0 ? 'increase' : 'decrease',
      note
    });

    res.json({ 
      success: true, 
      message: 'Cập nhật số tiền nợ thành công'
    });
  } catch (err) {
    console.error('Error updating debt amount:', err);
    res.status(500).json({ error: 'Lỗi khi cập nhật số tiền nợ' });
  }
});

// Xóa nợ của người dùng
router.delete('/users/:userId/debt', auth(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    if (user.debtAmount) {
      // Lưu lịch sử xóa nợ
      await DebtHistory.create({
        userId,
        date: new Date(),
        amount: 0,
        changeAmount: user.debtAmount,
        type: 'decrease',
        note: 'Xóa toàn bộ nợ'
      });
    }

    user.debtAmount = 0;
    user.lastDebtUpdate = new Date();
    await user.save();

    res.json({ 
      success: true, 
      message: 'Xóa nợ thành công' 
    });
  } catch (err) {
    console.error('Error deleting debt:', err);
    res.status(500).json({ error: 'Lỗi khi xóa nợ' });
  }
});

module.exports = router;
