import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './Auth/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const UserManagement = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form thêm người dùng mới
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${API_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi lấy danh sách người dùng.');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      if (!newUser.username || !newUser.email || !newUser.password) {
        setError('Vui lòng điền đầy đủ thông tin.');
        return;
      }
      await axios.post(`${API_URL}/api/auth/register`, newUser, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Thêm người dùng thành công!');
      setNewUser({
        username: '',
        email: '',
        password: '',
        role: 'user',
      });
      setShowAddUser(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi thêm người dùng.');
      console.error('Error adding user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (userId === user?.userId) {
      setError('Không thể xóa tài khoản của chính mình.');
      return;
    }

    if (!window.confirm('Bạn có chắc muốn xóa người dùng này?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      await axios.delete(`${API_URL}/api/auth/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Xóa người dùng thành công!');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi xóa người dùng.');
      console.error('Error deleting user:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">Bạn không có quyền truy cập trang này.</div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h1 className="h4 mb-0">Quản lý người dùng</h1>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          {loading && <div className="alert alert-info">Đang tải...</div>}

          <button
            className="btn btn-primary mb-3"
            onClick={() => setShowAddUser(true)}
          >
            Thêm người dùng
          </button>

          {showAddUser && (
            <div className="card mb-3">
              <div className="card-body">
                <h3 className="h5">Thêm người dùng mới</h3>
                <form onSubmit={handleAddUser}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Tên người dùng"
                        value={newUser.username}
                        onChange={(e) =>
                          setNewUser({ ...newUser, username: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Email"
                        value={newUser.email}
                        onChange={(e) =>
                          setNewUser({ ...newUser, email: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Mật khẩu"
                        value={newUser.password}
                        onChange={(e) =>
                          setNewUser({ ...newUser, password: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <select
                        className="form-select"
                        value={newUser.role}
                        onChange={(e) =>
                          setNewUser({ ...newUser, role: e.target.value })
                        }
                      >
                        <option value="user">Người dùng</option>
                        <option value="admin">Quản trị viên</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <button type="submit" className="btn btn-primary me-2">
                        Lưu
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowAddUser(false)}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>Tên người dùng</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Số tiền nợ</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && !loading ? (
                  <tr>
                    <td colSpan="5" className="text-center">
                      Không có người dùng nào.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id}>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>
                        <span
                          className={`badge ${
                            u.role === 'admin' ? 'bg-danger' : 'bg-success'
                          }`}
                        >
                          {u.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                        </span>
                      </td>
                      <td className="text-end">{u.debtAmount?.toLocaleString() || 0} VNĐ</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(u._id)}
                          disabled={u._id === user?.userId}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
