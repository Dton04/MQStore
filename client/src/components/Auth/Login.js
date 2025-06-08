import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../Auth/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }
    
    setLoading(true);
    setError('');    try {
      await login(email, password);
      navigate('/products');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-center">Đăng nhập</h3>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {loading && <div className="alert alert-info">Đang xử lý...</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Mật khẩu</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  Đăng nhập
                </button>
              </form>
              <p className="mt-3 text-center">
                Chưa có tài khoản? <a href="/register">Đăng ký</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;