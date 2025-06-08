const mongoose = require('mongoose');

const transactionItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  }
});

const transactionSchema = new mongoose.Schema({
  items: [transactionItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  user: {
    type: String,
    required: true, // Giả sử user là một chuỗi (tên hoặc ID người dùng)
  },
  status: {
    type: String,
    enum: ['paid', 'pending'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Transaction', transactionSchema);