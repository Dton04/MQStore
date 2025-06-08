import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import moment from 'moment';
import { AuthContext } from './Auth/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const DebtManagement = () => {
  const { user } = useContext(AuthContext);
  const [debts, setDebts] = useState([]);
  const [debtSummary, setDebtSummary] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list');
  const [editDebtUser, setEditDebtUser] = useState(null);
  const [newDebtAmount, setNewDebtAmount] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [groupedDebts, setGroupedDebts] = useState([]);
  const [showDebtDetails, setShowDebtDetails] = useState(false);
  const [selectedUserDebts, setSelectedUserDebts] = useState(null);
  const [editingDebt, setEditingDebt] = useState(null);
  const [showAddDebtForm, setShowAddDebtForm] = useState(false);
  const [newDebt, setNewDebt] = useState({
    amount: '',
    date: moment().format('YYYY-MM-DDTHH:mm'),
    note: ''
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDebts();
      fetchUsers();
    }
  }, [user, searchUser]);

  useEffect(() => {
    const summary = debts.reduce((acc, debt) => {
      const user = debt.user;
      if (!acc[user]) {
        acc[user] = {
          totalDebt: 0,
          transactionCount: 0,
          lastTransaction: null,
        };
      }
      if (debt.items && Array.isArray(debt.items)) {
        debt.items.forEach(item => {
          if (item.product?.price && item.quantity) {
            acc[user].totalDebt += item.product.price * item.quantity;
          }
        });
      }
      acc[user].transactionCount += 1;
      if (!acc[user].lastTransaction || moment(debt.createdAt).isAfter(acc[user].lastTransaction)) {
        acc[user].lastTransaction = debt.createdAt;
      }
      return acc;
    }, {});

    const summaryArray = Object.entries(summary)
      .map(([user, data]) => ({
        user,
        ...data,
      }))
      .sort((a, b) => b.totalDebt - a.totalDebt);

    setDebtSummary(summaryArray);
  }, [debts]);

  useEffect(() => {
    if (debts.length > 0) {
      const grouped = debts.reduce((acc, debt) => {
        const key = `${debt.user}_${moment(debt.createdAt).format('YYYY-MM-DD')}`;
        if (!acc[key]) {
          acc[key] = {
            user: debt.user,
            date: debt.createdAt,
            items: [],
            totalAmount: 0,
            status: debt.status
          };
        }
        if (debt.items && Array.isArray(debt.items)) {
          acc[key].items.push(...debt.items);
          debt.items.forEach(item => {
            if (item.product?.price && item.quantity) {
              acc[key].totalAmount += item.product.price * item.quantity;
            }
          });
        }
        return acc;
      }, {});

      const groupedArray = Object.values(grouped).sort((a, b) =>
        moment(b.date).valueOf() - moment(a.date).valueOf()
      );
      setGroupedDebts(groupedArray);
    } else {
      setGroupedDebts([]);
    }
  }, [debts]);

  const fetchDebts = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { status: 'pending', populate: true };
      if (searchUser) {
        params.user = searchUser.trim().toLowerCase();
      }
      const response = await axios.get(`${API_URL}/api/transactions`, {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setDebts(response.data.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi lấy danh sách nợ.');
      console.error(err);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${API_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi lấy danh sách người dùng.');
      console.error(err);
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (id) => {
    if (!window.confirm('Xác nhận đánh dấu giao dịch này đã thanh toán?')) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await axios.put(
        `${API_URL}/api/transactions/${id}`,
        { status: 'paid' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setSuccess('Đánh dấu đã thanh toán thành công!');
      setTimeout(() => setSuccess(''), 3000);
      fetchDebts();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi cập nhật giao dịch.');
      console.error(err);
      setLoading(false);
    }
  };

  const handleUpdateDebt = async (userId) => {
    if (!newDebtAmount && newDebtAmount !== 0) {
      setError('Vui lòng nhập số tiền nợ.');
      return;
    }

    const amount = parseFloat(newDebtAmount);
    if (isNaN(amount)) {
      setError('Số tiền nợ không hợp lệ.');
      return;
    }

    if (amount < 0) {
      setError('Số tiền nợ không được âm.');
      return;
    }

    if (!window.confirm(`Xác nhận cập nhật số tiền nợ thành ${amount.toLocaleString()} VNĐ?`)) {
      return;
    }

    try {
      if (!userId) {
        setError('ID người dùng không hợp lệ');
        return;
      }

      setLoading(true);
      setError('');
      setSuccess('');

      const response = await axios.put(
        `${API_URL}/api/auth/users/${userId}/debt`,
        { debtAmount: amount },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const { data } = response;
      if (data && data.data) {
        setSuccess('Cập nhật số tiền nợ thành công!');
        setEditDebtUser(null);
        setNewDebtAmount('');

        try {
          await Promise.all([
            fetchUsers(),
            fetchDebts()
          ]);
        } catch (updateErr) {
          console.error('Error refreshing data:', updateErr);
          setError('Đã cập nhật thành công nhưng không thể làm mới dữ liệu. Vui lòng tải lại trang.');
        }

        setTimeout(() => {
          setSuccess('');
        }, 3000);
      }
    } catch (err) {
      console.error('Error updating debt:', err);
      if (err.response) {
        if (err.response.status === 404) {
          setError('Không tìm thấy người dùng. Vui lòng tải lại trang.');
        } else if (err.response.data && err.response.data.error) {
          setError(err.response.data.error);
        } else {
          setError('Lỗi từ server: ' + err.response.status);
        }
      } else if (err.request) {
        setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setError('Lỗi khi cập nhật số tiền nợ: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceClick = (invoice) => {
    setSelectedInvoice(selectedInvoice?.user === invoice.user &&
      moment(selectedInvoice?.date).isSame(invoice.date) ? null : invoice);
  };

  const handleViewDebtDetails = (username) => {
    const user = users.find(u => u.username === username);
    if (!user) {
      setError('Không tìm thấy người dùng.');
      return;
    }
    const userDebts = groupedDebts.filter(debt => debt.user === username);
    setSelectedUserDebts({
      username,
      userId: user._id,
      debts: userDebts || []
    });
    setShowDebtDetails(true);
  };

  const handleUpdateDebtDetails = async (debtId, updatedData) => {
    try {
      setLoading(true);
      await axios.put(
        `${API_URL}/api/transactions/${debtId}`,
        updatedData,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      await Promise.all([fetchUsers(), fetchDebts()]);
      setSuccess('Cập nhật thông tin nợ thành công!');
      setEditingDebt(null);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi cập nhật thông tin nợ.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDebt = async () => {
    const { amount, date, note } = newDebt;

    if (!amount || isNaN(amount) || amount <= 0) {
      setError('Số tiền nợ không hợp lệ.');
      return;
    }

    if (!date) {
      setError('Vui lòng chọn ngày tháng cho khoản nợ.');
      return;
    }

    if (!window.confirm(`Xác nhận thêm khoản nợ mới: ${amount.toLocaleString()} VNĐ vào ngày ${moment(date).format('DD/MM/YYYY')}?`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await axios.post(
        `${API_URL}/api/transactions`,
        {
          user: editDebtUser,
          totalAmount: parseFloat(amount),
          createdAt: date,
          note: note,
          status: 'pending'
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess('Thêm khoản nợ mới thành công!');
      setShowAddDebtForm(false);
      setNewDebt({
        amount: '',
        date: moment().format('YYYY-MM-DDTHH:mm'),
        note: ''
      });

      await Promise.all([fetchDebts(), fetchUsers()]);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi thêm khoản nợ mới.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewDebt = async () => {
    try {
      const amount = parseFloat(newDebt.amount);
      if (!amount || isNaN(amount) || amount <= 0) {
        setError('Số tiền nợ không hợp lệ.');
        return;
      }

      if (!selectedUserDebts.userId) {
        setError('Không tìm thấy ID người dùng.');
        return;
      }

      const payload = {
        user: selectedUserDebts.userId,
        totalAmount: amount,
        createdAt: moment(newDebt.date).format('YYYY-MM-DD HH:mm:ss'),
        note: newDebt.note || '',
        status: 'pending'
      };

      const response = await axios.post(`${API_URL}/api/transactions`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setSuccess('Thêm khoản nợ thành công!');
        await fetchDebts();
        const userDebts = groupedDebts.filter(debt => debt.user === selectedUserDebts.username);
        setSelectedUserDebts({
          ...selectedUserDebts,
          debts: userDebts
        });
        setShowAddDebtForm(false);
        setNewDebt({
          amount: '',
          date: moment().format('YYYY-MM-DDTHH:mm'),
          note: ''
        });
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Lỗi khi thêm khoản nợ');
      }
    } catch (error) {
      console.error('Error adding new debt:', error);
      setError(error.response?.data?.error || 'Lỗi khi thêm khoản nợ');
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
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h1 className="h4 mb-0">Quản lý nợ</h1>
            <div className="btn-group">
              <button
                className={`btn btn-sm ${view === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setView('list')}
              >
                Danh sách giao dịch
              </button>
              <button
                className={`btn btn-sm ${view === 'summary' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setView('summary')}
              >
                Thống kê theo người
              </button>
              <button
                className={`btn btn-sm ${view === 'users' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setView('users')}
              >
                Danh sách người dùng
              </button>
            </div>
          </div>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Tìm kiếm theo tên người dùng"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
            />
            <button className="btn btn-primary" onClick={fetchDebts}>
              Tìm kiếm
            </button>
          </div>
        </div>

        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          {loading && <div className="alert alert-info">Đang tải...</div>}

          {view === 'summary' ? (
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Người dùng</th>
                    <th>Tổng nợ (VNĐ)</th>
                    <th>Số giao dịch</th>
                    <th>Giao dịch gần nhất</th>
                  </tr>
                </thead>
                <tbody>
                  {debtSummary.map((summary) => (
                    <tr key={summary.user}>
                      <td>{summary.user}</td>
                      <td className="text-danger fw-bold">{summary.totalDebt ? summary.totalDebt.toLocaleString() : '0'}</td>
                      <td>{summary.transactionCount || 0}</td>
                      <td>{summary.lastTransaction ? moment(summary.lastTransaction).format('DD/MM/YYYY HH:mm') : '-'}</td>
                    </tr>
                  ))}
                  {debtSummary.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center">Không có dữ liệu nợ</td>
                    </tr>
                  )}
                </tbody>
                {debtSummary.length > 0 && (
                  <tfoot className="table-light">
                    <tr>
                      <td className="fw-bold">Tổng cộng</td>
                      <td className="text-danger fw-bold">
                        {debtSummary.reduce((sum, item) => sum + (item.totalDebt || 0), 0).toLocaleString()}
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          ) : view === 'users' ? (
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Người dùng</th>
                    <th>Số tiền nợ (VNĐ)</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter((user) =>
                      user.username.toLowerCase().includes(searchUser.toLowerCase())
                    )
                    .map((user) => (
                      <tr key={user._id}>
                        <td>{user.username}</td>
                        <td className="text-danger fw-bold">{(user.debtAmount || 0).toLocaleString()}</td>
                        <td>
                          {editDebtUser === user._id ? (
                            <div className="input-group input-group-sm">
                              <input
                                type="number"
                                className="form-control"
                                value={newDebtAmount}
                                onChange={(e) => setNewDebtAmount(e.target.value)}
                                placeholder="Nhập số tiền nợ"
                              />
                              <button
                                className="btn btn-success"
                                onClick={() => handleUpdateDebt(user._id)}
                              >
                                <i className="bi bi-check"></i> Lưu
                              </button>
                              <button
                                className="btn btn-secondary"
                                onClick={() => {
                                  setEditDebtUser(null);
                                  setNewDebtAmount('');
                                }}
                              >
                                <i className="bi bi-x"></i> Hủy
                              </button>
                            </div>
                          ) : (
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-primary"
                                onClick={() => {
                                  setEditDebtUser(user._id);
                                  setNewDebtAmount(user.debtAmount || '');
                                }}
                              >
                                <i className="bi bi-pencil"></i> Cập nhật nợ
                              </button>
                              <button
                                className="btn btn-info text-white"
                                onClick={() => handleViewDebtDetails(user.username)}
                              >
                                <i className="bi bi-list-ul"></i> Chi tiết nợ
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center">Không có người dùng</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Người dùng</th>
                    <th>Tổng tiền</th>
                    <th>Ngày tạo</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedDebts.map((invoice, index) => (
                    <React.Fragment key={index}>
                      <tr
                        onClick={() => handleInvoiceClick(invoice)}
                        style={{ cursor: 'pointer' }}
                        className={selectedInvoice?.user === invoice.user &&
                          moment(selectedInvoice?.date).isSame(invoice.date) ? 'table-active' : ''}
                      >
                        <td>{invoice.user}</td>
                        <td>{invoice.totalAmount ? invoice.totalAmount.toLocaleString() : '0'} VNĐ</td>
                        <td>{moment(invoice.date).format('DD/MM/YYYY HH:mm')}</td>
                        <td>
                          <span className={`badge ${invoice.status === 'paid' ? 'bg-success' : 'bg-warning'}`}>
                            {invoice.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              const debtIds = invoice.items.map(item => item._id);
                              debtIds.forEach(id => handleMarkAsPaid(id));
                            }}
                          >
                            Đánh dấu đã trả
                          </button>
                        </td>
                      </tr>
                      {selectedInvoice?.user === invoice.user &&
                        moment(selectedInvoice?.date).isSame(invoice.date) && (
                          <tr>
                            <td colSpan="5" className="p-0">
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
                                    {invoice.items.map((item, itemIndex) => (
                                      <tr key={itemIndex}>
                                        <td>{item.product?.name || 'Sản phẩm không xác định'}</td>
                                        <td>{item.quantity || 0}</td>
                                        <td>{item.product?.price ? item.product.price.toLocaleString() : '0'} VNĐ</td>
                                        <td>{(item.product?.price && item.quantity) ? (item.product.price * item.quantity).toLocaleString() : '0'} VNĐ</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                    </React.Fragment>
                  ))}
                  {groupedDebts.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center">Không có giao dịch nợ</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showDebtDetails && selectedUserDebts && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Chi tiết nợ - {selectedUserDebts.username}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowDebtDetails(false);
                    setSelectedUserDebts(null);
                    setEditingDebt(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Người dùng</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedUserDebts.username}
                    readOnly
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Tổng nợ</label>
                  <input
                    type="text"
                    className="form-control"
                    value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
                      .format(selectedUserDebts.debts?.reduce((sum, debt) => sum + parseFloat(debt.totalAmount || 0), 0) || 0)}
                    readOnly
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Ghi chú</label>
                  <textarea
                    className="form-control"
                    value={selectedUserDebts.debts?.length > 0 ? selectedUserDebts.debts.map(debt => debt.note || '').join('\n') : ''}
                    readOnly
                    rows="3"
                  ></textarea>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6>Danh sách các khoản nợ</h6>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowAddDebtForm(true)}>
                    <i className="bi bi-plus"></i> Thêm nợ mới
                  </button>
                </div>

                {showAddDebtForm && (
                  <div className="card mb-3">
                    <div className="card-body">
                      <h6 className="card-title">Thêm khoản nợ mới</h6>
                      <div className="mb-3">
                        <label className="form-label">Số tiền</label>
                        <input
                          type="number"
                          className="form-control"
                          value={newDebt.amount}
                          onChange={(e) => setNewDebt({ ...newDebt, amount: e.target.value })}
                          placeholder="Nhập số tiền..."
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Ngày</label>
                        <input
                          type="datetime-local"
                          className="form-control"
                          value={newDebt.date}
                          onChange={(e) => setNewDebt({ ...newDebt, date: e.target.value })}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Ghi chú</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newDebt.note}
                          onChange={(e) => setNewDebt({ ...newDebt, note: e.target.value })}
                          placeholder="Nhập ghi chú..."
                        />
                      </div>
                      <div>
                        <button className="btn btn-success me-2" onClick={handleAddNewDebt}>
                          <i className="bi bi-check"></i> Lưu
                        </button>
                        <button className="btn btn-secondary" onClick={() => setShowAddDebtForm(false)}>
                          <i className="bi bi-x"></i> Hủy
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <table className="table">
                  <thead>
                    <tr>
                      <th>Ngày</th>
                      <th>Số tiền</th>
                      <th>Ghi chú</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUserDebts.debts?.length > 0 ? (
                      selectedUserDebts.debts.map((debt) => (
                        <tr key={debt.id}>
                          <td>
                            {editingDebt?.id === debt.id ? (
                              <input
                                type="datetime-local"
                                className="form-control"
                                value={editingDebt.date}
                                onChange={(e) => setEditingDebt({ ...editingDebt, date: e.target.value })}
                              />
                            ) : (
                              debt.date ? moment(debt.date).format('DD/MM/YYYY HH:mm') : '-'
                            )}
                          </td>
                          <td>
                            {editingDebt?.id === debt.id ? (
                              <input
                                type="number"
                                className="form-control"
                                value={editingDebt.amount}
                                onChange={(e) => setEditingDebt({ ...editingDebt, amount: e.target.value })}
                              />
                            ) : (
                              new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(debt.totalAmount || 0)
                            )}
                          </td>
                          <td>
                            {editingDebt?.id === debt.id ? (
                              <input
                                type="text"
                                className="form-control"
                                value={editingDebt.note}
                                onChange={(e) => setEditingDebt({ ...editingDebt, note: e.target.value })}
                              />
                            ) : (
                              debt.note || ''
                            )}
                          </td>
                          <td>
                            {editingDebt?.id === debt.id ? (
                              <>
                                <button
                                  className="btn btn-success btn-sm me-1"
                                  onClick={() => handleUpdateDebtDetails(debt.id)}
                                >
                                  <i className="bi bi-check"></i>
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setEditingDebt(null)}
                                >
                                  <i className="bi bi-x"></i>
                                </button>
                              </>
                            ) : (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setEditingDebt({ ...debt, date: debt.date ? moment(debt.date).format('YYYY-MM-DDTHH:mm') : moment().format('YYYY-MM-DDTHH:mm') })}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center">Không có khoản nợ nào</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDebtDetails(false);
                    setSelectedUserDebts(null);
                    setEditingDebt(null);
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddDebtForm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Thêm khoản nợ mới</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddDebtForm(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Người dùng</label>
                  <select
                    className="form-select"
                    value={editDebtUser || ''}
                    onChange={(e) => setEditDebtUser(e.target.value)}
                  >
                    <option value="">Chọn người dùng</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Số tiền nợ (VNĐ)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newDebt.amount}
                    onChange={(e) => setNewDebt({ ...newDebt, amount: e.target.value })}
                    placeholder="Nhập số tiền nợ"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Ngày tạo</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={moment(newDebt.date).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => setNewDebt({ ...newDebt, date: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Ghi chú</label>
                  <textarea
                    className="form-control"
                    value={newDebt.note}
                    onChange={(e) => setNewDebt({ ...newDebt, note: e.target.value })}
                    placeholder="Nhập ghi chú (tuỳ chọn)"
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddDebtForm(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddDebt}
                >
                  <i className="bi bi-plus-circle"></i> Thêm khoản nợ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtManagement;