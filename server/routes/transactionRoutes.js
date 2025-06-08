const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');

// POST /api/transactions
router.post('/', async (req, res) => {
  try {
    const { items, user, totalAmount } = req.body;
    console.log('Request body:', req.body);
    
    // Kiểm tra thông tin cơ bản
    if (!user) {
      return res.status(400).json({ error: 'Vui lòng cung cấp thông tin người dùng.' });
    }

    let calculatedTotalAmount = 0;
    const transactionItems = [];
    const productUpdates = [];

    // Nếu có items, xử lý như trước
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const { productId, quantity } = item;
        if (!productId || !quantity || quantity < 1) {
          return res.status(400).json({ error: 'Thông tin sản phẩm không hợp lệ.' });
        }

        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({ error: `Sản phẩm ${productId} không tồn tại.` });
        }
        if (product.quantity < quantity) {
          return res.status(400).json({ error: `Số lượng trong kho không đủ cho sản phẩm ${product.name}.` });
        }

        const itemPrice = product.price * quantity;
        calculatedTotalAmount += itemPrice;

        transactionItems.push({
          product: productId,
          quantity,
          price: itemPrice
        });

        productUpdates.push({
          updateOne: {
            filter: { _id: productId },
            update: {
              $inc: { quantity: -quantity },
              $set: { status: product.quantity === quantity ? 'out_of_stock' : 'in_stock' }
            }
          }
        });
      }
    } else {
      // Nếu không có items, sử dụng totalAmount từ body
      if (!totalAmount || isNaN(totalAmount) || totalAmount < 0) {
        return res.status(400).json({ error: 'Vui lòng cung cấp tổng tiền hợp lệ.' });
      }
      calculatedTotalAmount = parseFloat(totalAmount);
    }

    // Tạo transaction mới
    const transaction = new Transaction({
      items: transactionItems,
      totalAmount: calculatedTotalAmount,
      user,
      status: 'pending'
    });

    // Cập nhật số lượng sản phẩm (nếu có)
    if (productUpdates.length > 0) {
      await Product.bulkWrite(productUpdates);
    }
    
    // Lưu transaction
    await transaction.save();

    // Populate thông tin sản phẩm để trả về
    await transaction.populate('items.product');

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

    const transactions = await Transaction.find(query)
      .populate({
        path: 'items.product',
        select: 'name price' // Select only needed fields
      });
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
    ).populate('items.product');

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