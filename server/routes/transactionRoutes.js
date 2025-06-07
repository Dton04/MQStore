const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');

// POST /api/transactions
router.post('/', async (req, res) => {
  try {
    const { productId, quantity, user } = req.body;
    console.log('Request body:', req.body);
    if (!productId || !quantity || !user) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin giao dịch.' });
    }
    if (quantity < 1) {
      return res.status(400).json({ error: 'Số lượng phải lớn hơn 0.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại.' });
    }
    if (product.quantity < quantity) {
      return res.status(400).json({ error: 'Số lượng trong kho không đủ.' });
    }

    const totalPrice = product.price * quantity;
    const transaction = new Transaction({
      product: productId,
      quantity,
      totalPrice,
      user,
      status: 'pending', // Mặc định là nợ (chưa thanh toán)
    });

    // Giảm số lượng sản phẩm trong kho
    product.quantity -= quantity;
    if (product.quantity === 0) {
      product.status = 'out_of_stock';
    }
    await product.save();
    await transaction.save();

    res.json({ message: 'Giao dịch thành công!', data: transaction });
  } catch (err) {
    console.error('Error in POST /api/transactions:', err.message, err.stack);
    res.status(500).json({ error: 'Lỗi khi tạo giao dịch.', details: err.message });
  }
});

// GET /api/transactions
router.get('/', async (req, res) => {
  try {
    const { user, status } = req.query;
    const query = {};

    if (user) {
      query.user = { $regex: user, $options: 'i' }; // Tìm kiếm không phân biệt hoa thường
    }
    if (status) {
      query.status = status; // Lọc theo trạng thái (pending/paid)
    }

    const transactions = await Transaction.find(query).populate('product');
    res.json({ data: transactions });
  } catch (err) {
    console.error('Error in GET /api/transactions:', err.message, err.stack);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách giao dịch.' });
  }
});

// PUT /api/transactions/:id
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['pending', 'paid'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ. Phải là pending hoặc paid.' });
    }

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('product');

    if (!transaction) {
      return res.status(404).json({ error: 'Giao dịch không tồn tại.' });
    }

    res.json({ message: 'Cập nhật giao dịch thành công!', data: transaction });
  } catch (err) {
    console.error('Error in PUT /api/transactions/:id:', err.message, err.stack);
    res.status(500).json({ error: 'Lỗi khi cập nhật giao dịch.', details: err.message });
  }
});

module.exports = router;