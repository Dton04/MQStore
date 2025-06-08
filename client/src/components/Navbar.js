import React, { useContext, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from './Auth/AuthContext';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const Navbar = () => {
  const { user } = useContext(AuthContext);

  // Hàm đóng menu khi click vào link trên mobile
  const closeMenu = () => {
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    if (window.innerWidth < 992 && navbarCollapse.classList.contains('show')) {
      navbarToggler.click();
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top">
      <div className="container">
        <NavLink className="navbar-brand fw-bold" to="/" onClick={closeMenu}>
          🛒 Tạp hóa My Quyen
        </NavLink>
        <button
          className="navbar-toggler collapsed"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 text-center">            <li className="nav-item">
              <NavLink to="/" className="nav-link py-2" end onClick={closeMenu}>
                🏠 Trang chủ
              </NavLink>
            </li>

            {user ? (
              <>
                <li className="nav-item">
                  <NavLink to="/products" className="nav-link py-2" onClick={closeMenu}>
                    📦 Sản phẩm
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/categories" className="nav-link py-2" onClick={closeMenu}>
                    📑 Danh mục
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/transactions" className="nav-link py-2" onClick={closeMenu}>
                    💰 Giao dịch
                  </NavLink>
                </li>                {user.role === 'admin' && (
                  <>
                    <li className="nav-item">
                      <NavLink to="/debts" className="nav-link py-2" onClick={closeMenu}>
                        💳 Quản lý giao dịch nợ
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink to="/debt-list" className="nav-link py-2" onClick={closeMenu}>
                        📊 Quản lý nợ người dùng
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink to="/users" className="nav-link py-2" onClick={closeMenu}>
                        👥 Quản lý người dùng
                      </NavLink>
                    </li>
                  </>
                )}
                <li className="nav-item">
                  <NavLink to="/logout" className="nav-link text-warning py-2" onClick={closeMenu}>
                    🚪 Đăng xuất ({user.email})
                  </NavLink>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink to="/login" className="nav-link py-2" onClick={closeMenu}>
                    🔑 Đăng nhập
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/register" className="nav-link py-2" onClick={closeMenu}>
                    ✍️ Đăng ký
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
