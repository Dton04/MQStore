import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import moment from 'moment';
import { AuthContext } from './Auth/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const TransactionList = () => {
  const { user } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState('');
  const [newTransaction, setNewTransaction] = useState({
    user: '',
    items: [],
    totalAmount: 0
  });
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [groupedTransactions, setGroupedTransactions] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchTransactions();
    if (user?.role === 'admin') {
      fetchProducts();
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    if (transactions.length > 0) {
      const sortedTransactions = transactions.sort((a, b) => 
        moment(b.createdAt).valueOf() - moment(a.createdAt).valueOf()
      );
      setGroupedTransactions(sortedTransactions);
    } else {
      setGroupedTransactions([]);
    }
  }, [transactions]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/transactions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTransactions(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi lấy danh sách giao dịch.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProducts(response.data.data);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách sản phẩm:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách người dùng:', err);
    }
  };

  const handleAddItem = () => {
    setSelectedItems([...selectedItems, { productId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    const newItems = selectedItems.filter((_, i) => i !== index);
    setSelectedItems(newItems);
    updateTotalAmount(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...selectedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setSelectedItems(newItems);
    updateTotalAmount(newItems);
  };

  const updateTotalAmount = (items) => {
    const total = items.reduce((sum, item) => {
      const product = products.find(p => p._id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
    setTotalAmount(total);
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    
    if (!newTransaction.user) {
      setError('Vui lòng chọn người dùng.');
      return;
    }

    if (selectedItems.length === 0 && (!totalAmount || parseFloat(totalAmount) <= 0)) {
      setError('Vui lòng thêm sản phẩm hoặc nhập tổng tiền hợp lệ.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (selectedItems.length > 0) {
        const items = selectedItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }));

        await axios.post(
          `${API_URL}/api/transactions`,
          {
            items,
            user: newTransaction.user
          },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
      } else {
        await axios.post(
          `${API_URL}/api/transactions`,
          {
            items: [],
            totalAmount: parseFloat(totalAmount),
            user: newTransaction.user,
            status: 'pending'
          },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
      }

      setSuccess('Tạo hóa đơn nợ thành công!');
      setNewTransaction({ user: '', items: [], totalAmount: 0 });
      setSelectedItems([]);
      setTotalAmount('');
      setShowCreateModal(false);
      fetchTransactions();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi tạo hóa đơn nợ.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshTransactions = async () => {
    await fetchTransactions();
    setSuccess('Danh sách giao dịch đã được làm mới!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleInvoiceClick = (invoice) => {
    setSelectedInvoice(selectedInvoice?.user === invoice.user && 
      moment(selectedInvoice?.date).isSame(invoice.date) ? null : invoice);
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h1 className="h4 mb-0">Quản lý giao dịch</h1>
          <div>
            {user?.role === 'admin' && (
              <button
                className="btn btn-success btn-sm me-2"
                onClick={() => setShowCreateModal(true)}
              >
                Tạo hóa đơn nợ
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={refreshTransactions}>
              Làm mới
            </button>
          </div>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          {loading && <div className="alert alert-info">Đang tải...</div>}

          {showCreateModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Tạo hóa đơn nợ mới</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => {
                        setShowCreateModal(false);
                        setSelectedItems([]);
                        setTotalAmount('');
                      }}
                    ></button>
                  </div>
                  <form onSubmit={handleCreateTransaction}>
                    <div className="modal-body">
                      <div className="mb-3">
                        <label className="form-label">Người dùng</label>
                        <select
                          className="form-select"
                          value={newTransaction.user}
                          onChange={(e) => setNewTransaction({ ...newTransaction, user: e.target.value })}
                          required
                        >
                          <option value="">Chọn người dùng</option>
                          {users.map((user) => (
                            <option key={user._id} value={user.username}>
                              {user.username}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6>Danh sách sản phẩm (Tùy chọn)</h6>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={handleAddItem}
                          >
                            Thêm sản phẩm
                          </button>
                        </div>
                        
                        {selectedItems.map((item, index) => (
                          <div key={index} className="card mb-2">
                            <div className="card-body">
                              <div className="row g-2">
                                <div className="col-md-6">
                                  <select
                                    className="form-select"
                                    value={item.productId}
                                    onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                                    required
                                  >
                                    <option value="">Chọn sản phẩm</option>
                                    {products.map((product) => (
                                      <option key={product._id} value={product._id}>
                                        {product.name} - {product.price.toLocaleString()} VNĐ
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-md-4">
                                  <input
                                    type="number"
                                    className="form-control"
                                    placeholder="Số lượng"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                    min="1"
                                    required
                                  />
                                </div>
                                <div className="col-md-2">
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleRemoveItem(index)}
                                  >
                                    Xóa
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Tổng tiền (Nhập nếu không chọn sản phẩm)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Nhập tổng tiền"
                          value={totalAmount}
                          onChange={(e) => setTotalAmount(e.target.value)}
                          min="0"
                          disabled={selectedItems.length > 0}
                        />
                      </div>

                      {selectedItems.length > 0 && (
                        <div className="alert alert-info">
                          Tổng tiền: {totalAmount ? totalAmount.toLocaleString() : '0'} VNĐ
                        </div>
                      )}
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowCreateModal(false);
                          setSelectedItems([]);
                          setTotalAmount('');
                        }}
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || (!selectedItems.length && !totalAmount)}
                      >
                        {loading ? 'Đang xử lý...' : 'Tạo hóa đơn'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {groupedTransactions.length === 0 ? (
            <p>Chưa có giao dịch nào.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Người dùng</th>
                    <th>Tổng tiền</th>
                    <th>Ngày tạo</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedTransactions.map((invoice, index) => (
                    <React.Fragment key={index}>
                      <tr 
                        onClick={() => handleInvoiceClick(invoice)}
                        style={{ cursor: 'pointer' }}
                        className={selectedInvoice?.user === invoice.user && 
                          moment(selectedInvoice?.date).isSame(invoice.date) ? 'table-active' : ''}
                      >
                        <td>{invoice.user}</td>
                        <td>{invoice.totalAmount ? invoice.totalAmount.toLocaleString() : '0'} VNĐ</td>
                        <td>{moment(invoice.createdAt).format('DD/MM/YYYY HH:mm')}</td>

                        <td>
                          <span
                            className={`badge ${
                              invoice.status === 'paid' ? 'bg-success' : 'bg-warning'
                            }`}
                          >
                            {invoice.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                          </span>
                        </td>
                      </tr>
                      {selectedInvoice?.user === invoice.user && 
                        moment(selectedInvoice?.date).isSame(invoice.date) && (
                        <tr>
                          <td colSpan="4" className="p-0">
                            <div className="table-responsive">
                              <table className="table table-sm mb-0">
                                <thead className="table-light">
                                  <tr>
                                    <th>Sản phẩm</th>
                                    <th>Số lượng</th>
                                    <th>Đơn giá</th>
                                    <th>Thành tiền</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {invoice.items.length > 0 ? (
                                    invoice.items.map((item, itemIndex) => (
                                      <tr key={itemIndex}>
                                        <td>{item.product?.name || 'Sản phẩm không xác định'}</td>
                                        <td>{item.quantity}</td>
                                        <td>{item.price && item.quantity ? (item.price / item.quantity).toLocaleString() : '0'} VNĐ</td>
                                        <td>{item.price ? item.price.toLocaleString() : '0'} VNĐ</td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan="4" className="text-center">
                                        Giao dịch không có thông tin chi tiết sản phẩm
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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

export default TransactionList;