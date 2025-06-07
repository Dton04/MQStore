const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const authMiddleware = require('../middleware/auth');

// GET /api/products - Không yêu cầu đăng nhập
router.get('/', async (req, res) => {
  try {
    const {
      search,
      category,
      status,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) query.category = category;
    if (status) query.status = status;
    if (minPrice) query.price = { ...query.price, $gte: Number(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: Number(maxPrice) };

    const sortObj = {};
    sortObj[sortBy] = order === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;
    const totalItems = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const products = await Product.find(query)
      .populate('category')
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));

    res.json({ data: products, totalPages, page: Number(page) });
  } catch (err) {
    console.error('Error in GET /api/products:', err.message, err.stack);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/products - Chỉ admin
router.post('/', authMiddleware(['admin']), async (req, res) => {
  try {
    const { sku, name, category, price, quantity, status } = req.body;
    if (!sku || !name || !price || !quantity) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin sản phẩm.' });
    }
    if (price < 0 || quantity < 0) {
      return res.status(400).json({ error: 'Giá và số lượng không được âm.' });
    }
    if (status && !['in_stock', 'out_of_stock'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
    }
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ error: 'Danh mục không hợp lệ.' });
      }
    }
    const newProduct = new Product({ sku, name, category, price: Number(price), quantity: Number(quantity), status });
    await newProduct.save();
    res.json({ message: 'Thêm sản phẩm thành công!', data: newProduct });
  } catch (err) {
    console.error('Error in POST /api/products:', err.message, err.stack);
    res.status(500).json({ error: 'Lỗi khi thêm sản phẩm.', details: err.message });
  }
});

// PUT /api/products/:id - Chỉ admin
router.put('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const { sku, name, category, price, quantity, status } = req.body;
    if (!sku || !name || !price || !quantity) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin sản phẩm.' });
    }
    if (price < 0 || quantity < 0) {
      return res.status(400).json({ error: 'Giá và số lượng không được âm.' });
    }
    if (status && !['in_stock', 'out_of_stock'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
    }
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ error: 'Danh mục không hợp lệ.' });
      }
    }
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { 
        sku, 
        name, 
        category, 
        price: Number(price), 
        quantity: Number(quantity), 
        status: quantity === 0 ? 'out_of_stock' : status || 'in_stock' 
      },
      { new: true, runValidators: true }
    ).populate('category');
    if (!updatedProduct) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại.' });
    }
    res.json({ message: 'Cập nhật sản phẩm thành công!', data: updatedProduct });
  } catch (err) {
    console.error('Error in PUT /api/products/:id:', err.message, err.stack);
    res.status(500).json({ error: 'Lỗi khi cập nhật sản phẩm.', details: err.message });
  }
});

// DELETE /api/products/:id - Chỉ admin
router.delete('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại.' });
    }
    res.json({ message: 'Đã xóa' });
  } catch (err) {
    console.error('Error in DELETE /api/products/:id:', err.message, err.stack);
    res.status(500).json({ error: 'Lỗi khi xóa sản phẩm.' });
  }
});

module.exports = router;