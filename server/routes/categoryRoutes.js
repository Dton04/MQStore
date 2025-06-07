const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server khi lấy danh mục.' });
  }
});

// POST /api/categories
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Vui lòng cung cấp tên danh mục.' });
    }
    const newCategory = new Category({ name });
    await newCategory.save();
    res.json({ message: 'Thêm danh mục thành công!', data: newCategory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi thêm danh mục.' });
  }
});

//DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Danh mục không tồn tại.' });
    }
    res.json({ message: 'Xóa danh mục thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi xóa danh mục.' });
  }
});

module.exports = router;