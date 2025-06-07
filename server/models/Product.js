const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: String,
  name: String,
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  price: Number,
  quantity: Number,
  status: {
    type: String,
    enum: ['in_stock', 'out_of_stock'],
    default: 'in_stock',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Product', productSchema);
