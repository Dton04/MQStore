import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from './Auth/AuthContext';

const Navbar = () => {
  const { user } = useContext(AuthContext);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top">
      <div className="container-fluid">
        <NavLink className="navbar-brand fw-bold" to="/">
          🛒 Tạp hóa My Quyen
        </NavLink>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink to="/" className="nav-link" end>
                Trang chủ
              </NavLink>
            </li>

            {user ? (
              <>
                <li className="nav-item">
                  <NavLink to="/products" className="nav-link">
                    Sản phẩm
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/categories" className="nav-link">
                    Danh mục
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/transactions" className="nav-link">
                    Giao dịch
                  </NavLink>
                </li>
                {user.role === 'admin' && (
                  <>
                    <li className="nav-item">
                      <NavLink to="/debts" className="nav-link">
                        Quản lý nợ
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink to="/users" className="nav-link">
                        Quản lý người dùng
                      </NavLink>
                    </li>
                  </>
                )}
                <li className="nav-item">
                  <NavLink to="/logout" className="nav-link text-warning">
                    Đăng xuất ({user.email})
                  </NavLink>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink to="/login" className="nav-link">
                    Đăng nhập
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/register" className="nav-link">
                    Đăng ký
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
