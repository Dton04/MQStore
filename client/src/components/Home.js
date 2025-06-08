import React, { useContext } from 'react';
import { AuthContext } from './Auth/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const Home = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h1 className="h4 mb-0">Trang chủ</h1>
        </div>
        <div className="card-body">
          <p>Chào mừng {user ? `người dùng ${user.role}` : 'khách'} đến với hệ thống quản lý cửa hàng!</p>
        </div>
      </div>
    </div>
  );
};

export default Home;