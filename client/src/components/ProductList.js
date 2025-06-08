import React, { useEffect, useState, useCallback, useContext } from 'react';
import axios from 'axios';
import debounce from 'lodash/debounce';
import { AuthContext } from './Auth/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const ProductList = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter, tìm kiếm, sắp xếp
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  // Form thêm sản phẩm
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    category: '',
    price: '',
    quantity: '',
    status: 'in_stock',
  });

  // Form sửa sản phẩm
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editProduct, setEditProduct] = useState({
    id: '',
    sku: '',
    name: '',
    category: '',
    price: '',
    quantity: '',
    status: 'in_stock',
  });

  // Form thêm danh mục
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  // Giỏ hàng
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [cartUser, setCartUser] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchCategories();
  }, []);

  const debouncedFetchProducts = useCallback(
    debounce(() => {
      fetchProducts();
    }, 500),
    [search, categoryFilter, statusFilter, minPrice, maxPrice, sortBy, order, page]
  );

  useEffect(() => {
    debouncedFetchProducts();
  }, [search, categoryFilter, statusFilter, minPrice, maxPrice, sortBy, order, page, debouncedFetchProducts]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${API_URL}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data)) {
        setCategories(res.data);
      } else {
        throw new Error('Dữ liệu danh mục không hợp lệ');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi lấy danh mục.');
      console.error('Lỗi khi lấy danh mục:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      if (minPrice && Number(minPrice) < 0) {
        setError('Giá tối thiểu không được âm.');
        return;
      }
      if (maxPrice && Number(maxPrice) < 0) {
        setError('Giá tối đa không được âm.');
        return;
      }
      if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
        setError('Giá tối thiểu không được lớn hơn giá tối đa.');
        return;
      }

      const params = {
        search,
        category: categoryFilter,
        status: statusFilter,
        minPrice,
        maxPrice,
        sortBy,
        order,
        page,
        limit: 10,
      };
      const res = await axios.get(`${API_URL}/api/products`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.data && Array.isArray(res.data.data)) {
        setProducts(res.data.data);
        setTotalPages(res.data.totalPages || 1);
      } else {
        throw new Error('Dữ liệu sản phẩm không hợp lệ');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi lấy sản phẩm.');
      console.error('Lỗi khi lấy sản phẩm:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await axios.delete(`${API_URL}/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Xóa sản phẩm thành công!');
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi xóa sản phẩm.');
      console.error('Lỗi khi xóa sản phẩm:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      if (!newProduct.sku || !newProduct.name || !newProduct.price || !newProduct.quantity) {
        setError('Vui lòng điền đầy đủ thông tin sản phẩm.');
        return;
      }
      await axios.post(`${API_URL}/api/products`, newProduct, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Thêm sản phẩm thành công!');
      setNewProduct({ sku: '', name: '', category: '', price: '', quantity: '', status: 'in_stock' });
      setShowAddProduct(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi thêm sản phẩm.');
      console.error('Lỗi khi thêm sản phẩm:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      if (!editProduct.sku || !editProduct.name || !editProduct.price || !editProduct.quantity) {
        setError('Vui lòng điền đầy đủ thông tin sản phẩm.');
        return;
      }
      await axios.put(
        `${API_URL}/api/products/${editProduct.id}`,
        {
          sku: editProduct.sku,
          name: editProduct.name,
          category: editProduct.category || undefined,
          price: Number(editProduct.price),
          quantity: Number(editProduct.quantity),
          status: editProduct.status,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess('Cập nhật sản phẩm thành công!');
      setEditProduct({ id: '', sku: '', name: '', category: '', price: '', quantity: '', status: 'in_stock' });
      setShowEditProduct(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi cập nhật sản phẩm.');
      console.error('Lỗi khi cập nhật sản phẩm:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      if (!newCategory) {
        setError('Vui lòng nhập tên danh mục.');
        return;
      }
      await axios.post(
        `${API_URL}/api/categories`,
        { name: newCategory },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess('Thêm danh mục thành công!');
      setNewCategory('');
      setShowAddCategory(false);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi thêm danh mục.');
      console.error('Lỗi khi thêm danh mục:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditProduct = (product) => {
    setEditProduct({
      id: product._id,
      sku: product.sku,
      name: product.name,
      category: product.category ? product.category._id : '',
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      status: product.status,
    });
    setShowEditProduct(true);
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleAddToCart = (product) => {
    const existingItem = cartItems.find((item) => item.productId === product._id);
    if (existingItem) {
      if (existingItem.quantity >= product.quantity) {
        setError(`Không thể thêm: Số lượng trong kho (${product.quantity}) không đủ.`);
        return;
      }
      setCartItems(
        cartItems.map((item) =>
          item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      if (product.quantity < 1) {
        setError(`Không thể thêm: Sản phẩm ${product.name} đã hết hàng.`);
        return;
      }
      setCartItems([...cartItems, { productId: product._id, name: product.name, price: product.price, quantity: 1 }]);
    }
    setSuccess(`Đã thêm ${product.name} vào giỏ hàng!`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleUpdateCartQuantity = (productId, newQuantity) => {
    const product = products.find((p) => p._id === productId);
    if (!product) return;
    if (newQuantity < 1) {
      setCartItems(cartItems.filter((item) => item.productId !== productId));
    } else if (newQuantity > product.quantity) {
      setError(`Số lượng tối đa cho ${product.name} là ${product.quantity}.`);
    } else {
      setCartItems(
        cartItems.map((item) =>
          item.productId === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems(cartItems.filter((item) => item.productId !== productId));
  };
  const calculateCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const itemTotal = item.price && item.quantity ? item.price * item.quantity : 0;
      return total + itemTotal;
    }, 0);
  };const handleCreateTransaction = async () => {
    if (!cartUser && !user) {
      setError('Vui lòng nhập tên người dùng hoặc đăng nhập.');
      return;
    }
    if (cartItems.length === 0) {
      setError('Giỏ hàng trống.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Gom tất cả sản phẩm vào một giao dịch
      const items = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      await axios.post(
        `${API_URL}/api/transactions`,
        {
          items,
          user: user ? user.username : cartUser
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setSuccess('Tạo giao dịch thành công!');
      setCartItems([]);
      setCartUser('');
      setShowCart(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi tạo giao dịch.');
      console.error('Lỗi khi tạo giao dịch:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h1 className="h4 mb-0">Quản lý sản phẩm</h1>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          {loading && <div className="alert alert-info">Đang tải...</div>}

          <div className="mb-3 d-flex gap-2">
            <button
              className="btn btn-primary"
              onClick={() => setShowAddProduct(true)}
            >
              Thêm sản phẩm
            </button>
            <button
              className="btn btn-success"
              onClick={() => setShowAddCategory(true)}
            >
              Thêm danh mục
            </button>
            <button
              className="btn btn-info"
              onClick={() => setShowCart(true)}
            >
              Xem giỏ hàng ({cartItems.length})
            </button>
          </div>

          {showAddProduct && (
            <div className="card mb-3">
              <div className="card-body">
                <h3 className="h5">Thêm sản phẩm mới</h3>
                <form onSubmit={handleAddProduct}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Mã SKU"
                        value={newProduct.sku}
                        onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Tên sản phẩm"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <select
                        className="form-select"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Giá"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Số lượng"
                        value={newProduct.quantity}
                        onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <select
                        className="form-select"
                        value={newProduct.status}
                        onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value })}
                      >
                        <option value="in_stock">Còn hàng</option>
                        <option value="out_of_stock">Hết hàng</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <button type="submit" className="btn btn-primary me-2">
                        Lưu
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowAddProduct(false)}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showEditProduct && (
            <div className="card mb-3">
              <div className="card-body">
                <h3 className="h5">Sửa sản phẩm</h3>
                <form onSubmit={handleEditProduct}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Mã SKU"
                        value={editProduct.sku}
                        onChange={(e) => setEditProduct({ ...editProduct, sku: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Tên sản phẩm"
                        value={editProduct.name}
                        onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <select
                        className="form-select"
                        value={editProduct.category}
                        onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Giá"
                        value={editProduct.price}
                        onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Số lượng"
                        value={editProduct.quantity}
                        onChange={(e) => setEditProduct({ ...editProduct, quantity: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <select
                        className="form-select"
                        value={editProduct.status}
                        onChange={(e) => setEditProduct({ ...editProduct, status: e.target.value })}
                      >
                        <option value="in_stock">Còn hàng</option>
                        <option value="out_of_stock">Hết hàng</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <button type="submit" className="btn btn-primary me-2">
                        Lưu
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowEditProduct(false)}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showAddCategory && (
            <div className="card mb-3">
              <div className="card-body">
                <h3 className="h5">Thêm danh mục mới</h3>
                <form onSubmit={handleAddCategory}>
                  <div className="row g-3">
                    <div className="col-12">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Tên danh mục"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                      />
                    </div>
                    <div className="col-12">
                      <button type="submit" className="btn btn-success me-2">
                        Lưu
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowAddCategory(false)}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showCart && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Giỏ hàng</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowCart(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    {cartItems.length === 0 ? (
                      <p>Giỏ hàng trống.</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-bordered">
                          <thead>
                            <tr>
                              <th>Sản phẩm</th>
                              <th>Giá (VNĐ)</th>
                              <th>Số lượng</th>
                              <th>Tổng</th>
                              <th>Hành động</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cartItems.map((item) => (
                              <tr key={item.productId}>
                                <td>{item.name}</td>                                <td>{item.price ? item.price.toLocaleString() : '0'}</td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleUpdateCartQuantity(item.productId, Number(e.target.value))
                                    }
                                    min="0"
                                    style={{ width: '80px' }}
                                  />
                                </td>
                                <td>{item.price && item.quantity ? (item.price * item.quantity).toLocaleString() : '0'}</td>
                                <td>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleRemoveFromCart(item.productId)}
                                  >
                                    Xóa
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <h5>Tổng cộng: {calculateCartTotal().toLocaleString()} VNĐ</h5>
                      </div>
                    )}                    {!user && (
                      <div className="mt-3">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Tên người dùng"
                          value={cartUser}
                          onChange={(e) => setCartUser(e.target.value)}
                        />
                      </div>
                    )}
                    {user && (
                      <div className="mt-3">
                        <p className="mb-0">
                          <strong>Người mua:</strong> {user.username} ({user.email})
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn btn-primary"
                      onClick={handleCreateTransaction}
                      disabled={cartItems.length === 0 || (!cartUser && !user)}
                    >
                      Tạo giao dịch
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowCart(false)}
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="row g-3 mb-3">
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Tìm kiếm tên hoặc mã SKU"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="in_stock">Còn hàng</option>
                <option value="out_of_stock">Hết hàng</option>
              </select>
            </div>
            <div className="col-md-2">
              <input
                type="number"
                className="form-control"
                placeholder="Giá từ"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <input
                type="number"
                className="form-control"
                placeholder="Giá đến"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            <div className="col-md-1">
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Tên</option>
                <option value="price">Giá</option>
                <option value="createdAt">Ngày thêm</option>
              </select>
            </div>
            <div className="col-md-1">
              <select
                className="form-select"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              >
                <option value="asc">Tăng</option>
                <option value="desc">Giảm</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>Mã sản phẩm</th>
                  <th>Tên</th>
                  <th>Danh mục</th>
                  <th>Giá (VNĐ)</th>
                  <th>Số lượng</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 && !loading && (
                  <tr>
                    <td colSpan="7" className="text-center">
                      Không có sản phẩm nào
                    </td>
                  </tr>
                )}
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>{p.sku}</td>
                    <td>{p.name}</td>                    <td>{p.category ? p.category.name : 'Chưa phân loại'}</td>
                    <td>{p.price ? p.price.toLocaleString() : '0'}</td>
                    <td>{p.quantity || 0}</td>
                    <td>{p.status === 'in_stock' ? 'Còn hàng' : 'Hết hàng'}</td><td>
                      {user?.role === 'admin' && (
                        <>
                          <button
                            className="btn btn-warning btn-sm me-2"
                            onClick={() => handleOpenEditProduct(p)}
                          >
                            Sửa
                          </button>
                          <button
                            className="btn btn-danger btn-sm me-2"
                            onClick={() => handleDelete(p._id)}
                          >
                            Xóa
                          </button>
                        </>
                      )}
                      <button
                        className="btn btn-info btn-sm"
                        onClick={() => handleAddToCart(p)}
                        disabled={p.quantity === 0}
                      >
                        Thêm vào giỏ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center gap-2 mt-3">
              <button
                className="btn btn-primary"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                Trang trước
              </button>
              <span className="align-self-center">Trang {page} / {totalPages}</span>
              <button
                className="btn btn-primary"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
              >
                Trang sau
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;