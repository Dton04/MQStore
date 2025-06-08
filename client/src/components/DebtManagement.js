import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import moment from 'moment';
import { AuthContext } from './Auth/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const DebtManagement = () => {
  const { user } = useContext(AuthContext);
  const [debts, setDebts] = useState([]);
  const [debtSummary, setDebtSummary] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list'); // 'list', 'summary', hoặc 'users'
  const [editDebtUser, setEditDebtUser] = useState(null);
  const [newDebtAmount, setNewDebtAmount] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDebts();
      fetchUsers();
    }
  }, [user, searchUser]);

  // Tính toán tổng nợ cho mỗi người dùng
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
      acc[user].totalDebt += debt.totalPrice;
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

  const fetchDebts = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { status: 'pending' };
      if (searchUser) {
        params.user = searchUser;
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
      setError('');      const response = await axios.get(`${API_URL}/api/auth/users`, {
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
    if (!newDebtAmount || isNaN(newDebtAmount) || newDebtAmount < 0) {
      setError('Số tiền nợ không hợp lệ.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await axios.put(
        `${API_URL}/api/users/${userId}/debt`,
        { debtAmount: parseFloat(newDebtAmount) },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setSuccess('Cập nhật số tiền nợ thành công!');
      setTimeout(() => setSuccess(''), 3000);
      setEditDebtUser(null);
      setNewDebtAmount('');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi cập nhật số tiền nợ.');
      console.error(err);
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
            // Hiển thị thống kê theo người
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
                      <td className="text-danger fw-bold">{summary.totalDebt.toLocaleString()}</td>
                      <td>{summary.transactionCount}</td>
                      <td>{moment(summary.lastTransaction).format('DD/MM/YYYY HH:mm')}</td>
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
                        {debtSummary.reduce((sum, item) => sum + item.totalDebt, 0).toLocaleString()}
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          ) : view === 'users' ? (
            // Hiển thị danh sách người dùng
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
                  {users.map((user) => (
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
                              oniClick={() => handleUpdateDebt(user._id)}
                            >
                              Lưu
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={() => {
                                setEditDebtUser(null);
                                setNewDebtAmount('');
                              }}
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setEditDebtUser(user._id);
                              setNewDebtAmount(user.debtAmount || '');
                            }}
                          >
                            Cập nhật nợ
                          </button>
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
            // Hiển thị danh sách giao dịch
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Người dùng</th>
                    <th>Sản phẩm</th>
                    <th>Số lượng</th>
                    <th>Tổng giá (VNĐ)</th>
                    <th>Ngày tạo</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {debts.map((debt) => (
                    <tr key={debt._id}>
                      <td>{debt.user}</td>
                      <td>{debt.product?.name || 'Sản phẩm không xác định'}</td>
                      <td>{debt.quantity}</td>
                      <td>{debt.totalPrice.toLocaleString()}</td>
                      <td>{moment(debt.createdAt).format('DD/MM/YYYY HH:mm')}</td>
                      <td>
                        <span className="badge bg-warning">Chưa thanh toán</span>
                      </td>
                      <td>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleMarkAsPaid(debt._id)}
                        >
                          Đánh dấu đã trả
                        </button>
                      </td>
                    </tr>
                  ))}
                  {debts.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center">Không có giao dịch nợ</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebtManagement;