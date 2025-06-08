import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import moment from 'moment';
import { AuthContext } from './Auth/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const DebtList = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [debtAmount, setDebtAmount] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [debtHistory, setDebtHistory] = useState([]);
  const [hasUpdates, setHasUpdates] = useState(false); // Thêm trạng thái để kiểm tra có cập nhật không

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    // Kiểm tra xem có người dùng nào có lastDebtUpdate không
    setHasUpdates(users.some(user => user.lastDebtUpdate));
  }, [users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(response.data);
    } catch (err) {
      setError('Lỗi khi tải danh sách người dùng');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingUser) {
      setError('Vui lòng chọn người dùng');
      return;
    }
    
    if (!debtAmount) {
      setError('Vui lòng nhập số tiền');
      return;
    }
    const newDebtAmount = parseFloat(debtAmount);
    if (isNaN(newDebtAmount)) {
      setError('Số tiền không hợp lệ');
      return;
    }

    if (newDebtAmount < 0) {
      setError('Số tiền nợ không được âm');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      // If adding new debt, add to existing debt amount
      const finalAmount = editingUser.debtAmount ? editingUser.debtAmount + newDebtAmount : newDebtAmount;
      
      const response = await axios.post(
        `${API_URL}/api/debts/users/${editingUser._id}/debt`, 
        { 
          debtAmount: finalAmount,
          newDebtAmount: newDebtAmount,
          note: editingUser.note || `Thêm nợ mới: ${newDebtAmount.toLocaleString()} VNĐ`,
        },
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSuccess('Cập nhật số tiền nợ thành công');
        await fetchUsers();
        setShowAddForm(false);
        setEditingUser(null);
        setDebtAmount('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi cập nhật số tiền nợ');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setDebtAmount(user.debtAmount?.toString() || '');
    setShowAddForm(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Bạn có chắc muốn xóa khoản nợ này?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(
        `${API_URL}/api/debts/users/${userId}/debt`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      setSuccess('Xóa khoản nợ thành công');
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi xóa khoản nợ');
    } finally {
      setLoading(false);
    }
  };

  const viewHistory = async (user) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/debts/users/${user._id}/debt-history`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      setDebtHistory(response.data || []);
      setSelectedUser(user);
      setShowHistory(true);
    } catch (err) {
      setError('Lỗi khi tải lịch sử nợ');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="container mt-4">Vui lòng đăng nhập để tiếp tục.</div>;
  }

  if (user.role !== 'admin') {
    return <div className="container mt-4">Bạn không có quyền truy cập trang này.</div>;
  }

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Quản lý nợ người dùng</h5>
            <button 
              className="btn btn-primary"
              onClick={() => {
                setEditingUser(null);
                setDebtAmount('');
                setShowAddForm(true);
              }}
            >
              <i className="bi bi-plus"></i> Thêm mới
            </button>
          </div>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          {loading && <div className="alert alert-info">Đang xử lý...</div>}

          {/* Search input */}
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Tìm kiếm người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Desktop view */}
          <div className="d-none d-md-block">
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Tên người dùng</th>
                    <th>Số tiền nợ</th>
                    {hasUpdates && <th>Cập nhật lần cuối</th>}
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter(user => 
                      user.username.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(user => (
                      <tr key={user._id}>
                        <td>{user.username}</td>
                        <td className="text-danger">
                          {(user.debtAmount || 0).toLocaleString()} VNĐ
                        </td>
                        {hasUpdates && (
                          <td>
                            {user.lastDebtUpdate ? 
                              moment(user.lastDebtUpdate).format('DD/MM/YYYY HH:mm') : 
                              null
                            }
                          </td>
                        )}
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-primary"
                              onClick={() => handleEdit(user)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleDelete(user._id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                            <button
                              className="btn btn-info text-white"
                              onClick={() => viewHistory(user)}
                            >
                              <i className="bi bi-clock-history"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile view */}
          <div className="d-md-none">
            {users
              .filter(user => 
                user.username.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(user => (
                <div key={user._id} className="card mb-3 shadow-sm">
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="card-title mb-0">{user.username}</h6>
                      <span className="text-danger fw-bold">
                        {(user.debtAmount || 0).toLocaleString()} VNĐ
                      </span>
                    </div>
                    {hasUpdates && user.lastDebtUpdate && (
                      <p className="card-text small text-muted mb-2">
                        <i className="bi bi-clock me-1"></i>
                        {moment(user.lastDebtUpdate).format('DD/MM/YYYY HH:mm')}
                      </p>
                    )}
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-primary btn-sm flex-grow-1"
                        onClick={() => handleEdit(user)}
                      >
                        <i className="bi bi-pencil me-1"></i>
                        Sửa
                      </button>
                      <button
                        className="btn btn-danger btn-sm flex-grow-1"
                        onClick={() => handleDelete(user._id)}
                      >
                        <i className="bi bi-trash me-1"></i>
                        Xóa
                      </button>
                      <button
                        className="btn btn-info btn-sm text-white flex-grow-1"
                        onClick={() => viewHistory(user)}
                      >
                        <i className="bi bi-clock-history me-1"></i>
                        Xem
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>      {/* Modal thêm/sửa nợ */}
      {showAddForm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingUser ? 'Cập nhật nợ' : 'Thêm nợ mới'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingUser(null);
                    setDebtAmount('');
                  }}
                ></button>
              </div>
              <form onSubmit={handleSubmit} className="h-100">
                <div className="modal-body">
                  {!editingUser && (
                    <div className="mb-4">
                      <label className="form-label fw-bold">Người dùng</label>
                      <select 
                        className="form-select form-select-lg mb-3"
                        value={editingUser?._id || ''}
                        onChange={(e) => {                          
                          const selected = users.find(u => u._id === e.target.value);
                          if (selected) {
                            setEditingUser({
                              ...selected,
                              note: ''
                            });
                            setDebtAmount(selected.debtAmount?.toString() || '');
                          }
                        }}
                        required
                      >
                        <option value="">Chọn người dùng</option>
                        {users.map(user => (
                          <option key={user._id} value={user._id}>
                            {user.username}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <label className="form-label fw-bold">Số tiền nợ (VNĐ)</label>
                    <input
                      type="number"
                      className="form-control form-control-lg mb-3"
                      value={debtAmount}
                      onChange={(e) => setDebtAmount(e.target.value)}
                      placeholder="Nhập số tiền nợ"
                      required
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-bold">Ghi chú</label>
                    <textarea
                      className="form-control"
                      value={editingUser?.note || ''}
                      onChange={(e) => setEditingUser({
                        ...editingUser,
                        note: e.target.value
                      })}
                      placeholder="Nhập ghi chú (không bắt buộc)"
                      rows="3"
                    />
                  </div>
                </div>
                <div className="modal-footer d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary flex-grow-1"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingUser(null);
                      setDebtAmount('');
                    }}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary flex-grow-1">
                    {editingUser ? 'Cập nhật' : 'Thêm mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}      {/* Modal xem lịch sử */}
      {showHistory && selectedUser && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-fullscreen-sm-down">
            <div className="modal-content">
              <div className="modal-header border-bottom">
                <h5 className="modal-title">
                  Lịch sử nợ - {selectedUser.username}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowHistory(false);
                    setSelectedUser(null);
                    setDebtHistory([]);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="bg-light p-3 rounded mb-4">
                  <h6 className="mb-0">
                    Tổng nợ hiện tại: 
                    <span className="text-danger fw-bold ms-2">
                      {selectedUser.debtAmount?.toLocaleString() || '0'} VNĐ
                    </span>
                  </h6>
                </div>

                <div className="d-none d-md-block"> {/* Desktop view */}
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Ngày</th>
                          <th>Tổng nợ</th>
                          <th>Thay đổi</th>
                          <th>Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debtHistory.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="text-center">
                              Không có lịch sử nợ
                            </td>
                          </tr>
                        ) : (
                          debtHistory.map(record => (
                            <tr key={record._id}>
                              <td>{moment(record.date).format('DD/MM/YYYY HH:mm')}</td>
                              <td>{record.amount.toLocaleString()} VNĐ</td>
                              <td>
                                <span className={record.type === 'increase' ? 'text-danger' : 'text-success'}>
                                  {record.type === 'increase' ? '+' : '-'}
                                  {record.changeAmount.toLocaleString()} VNĐ
                                </span>
                              </td>
                              <td>{record.note || '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="d-md-none"> {/* Mobile view */}
                  {debtHistory.length === 0 ? (
                    <div className="text-center p-3">
                      <p className="mb-0">Không có lịch sử nợ</p>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {debtHistory.map(record => (
                        <div key={record._id} className="list-group-item px-0">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <small className="text-muted">
                              {moment(record.date).format('DD/MM/YYYY HH:mm')}
                            </small>
                            <span className={`badge ${record.type === 'increase' ? 'bg-danger' : 'bg-success'}`}>
                              {record.type === 'increase' ? '+' : '-'}
                              {record.changeAmount.toLocaleString()} VNĐ
                            </span>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">Tổng nợ:</span>
                            <span className="fw-bold">
                              {record.amount.toLocaleString()} VNĐ
                            </span>
                          </div>
                          {record.note && (
                            <div className="small text-muted border-top pt-1 mt-1">
                              {record.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary w-100"
                  onClick={() => {
                    setShowHistory(false);
                    setSelectedUser(null);
                    setDebtHistory([]);
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtList;