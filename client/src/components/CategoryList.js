import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCategories(response.data);
      setError('');
    } catch (err) {
      setError('Lỗi khi lấy danh sách danh mục.');
      console.error(err);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) {
      setError('Tên danh mục không được để trống.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/categories`,
        { name: newCategory },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setCategories([...categories, response.data.data]);
      setNewCategory('');
      setSuccess('Thêm danh mục thành công!');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi thêm danh mục.');
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/categories/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCategories(categories.filter((category) => category._id !== id));
      setSuccess('Xóa danh mục thành công!');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Lỗi khi xóa danh mục.');
      console.error(err);
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow-lg border-0">
        <div className="card-body p-5">
          <h1 className="card-title mb-4 fw-bold text-primary">
            <i className="bi bi-list-ul me-2"></i>Quản lý danh mục
          </h1>

          {/* Form thêm danh mục */}
          <form onSubmit={handleAddCategory} className="mb-5">
            <div className="input-group mb-3">
              <span className="input-group-text bg-primary text-white">
                <i className="bi bi-tag-fill"></i>
              </span>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nhập tên danh mục"
                className="form-control py-2"
              />
              <button
                type="submit"
                className="btn btn-primary px-4"
              >
                <i className="bi bi-plus-circle me-2"></i>Thêm
              </button>
            </div>
            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {error}
                <button type="button" className="btn-close" onClick={() => setError('')}></button>
              </div>
            )}
            {success && (
              <div className="alert alert-success alert-dismissible fade show" role="alert">
                {success}
                <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
              </div>
            )}
          </form>

          {/* Danh sách danh mục */}
          {categories.length === 0 ? (
            <div className="alert alert-info text-center">
              <i className="bi bi-info-circle me-2"></i>Chưa có danh mục nào.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-bordered">
                <thead className="table-primary">
                  <tr>
                    <th scope="col" className="px-4 py-3">Tên danh mục</th>
                    <th scope="col" className="px-4 py-3 text-end">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category._id} className="align-middle">
                      <td className="px-4 py-3">{category.name}</td>
                      <td className="px-4 py-3 text-end">
                        <button
                          onClick={() => handleDeleteCategory(category._id)}
                          className="btn btn-danger btn-sm"
                        >
                          <i className="bi bi-trash-fill me-2"></i>Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryList;