import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // API URL từ biến môi trường
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Auth status check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });
      
      const { token, role, username } = response.data;
      
      // Lưu token vào localStorage
      localStorage.setItem('token', token);
      
      // Cấu hình axios với token mới
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set user state với thông tin từ token
      setUser({
        email,
        role,
        username
      });
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Đăng nhập thất bại, vui lòng thử lại');
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, userData);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};