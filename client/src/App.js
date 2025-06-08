import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './components/Auth/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Navbar from './components/Navbar';
import ProductList from './components/ProductList';
import CategoryList from './components/CategoryList';
import TransactionList from './components/TransactionList';
import DebtManagement from './components/DebtManagement';
import DebtList from './components/DebtList';
import UserManagement from './components/UserManagement';
import Home from './components/Home';
import 'bootstrap/dist/css/bootstrap.min.css';

const PrivateRoute = ({ component: Component, roles, ...rest }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  return user && (!roles || roles.includes(user.role)) ? (
    <Component {...rest} />
  ) : (
    <Navigate to="/login" replace />
  );
};

const Logout = () => {
  const { logout } = useContext(AuthContext);
  logout();
  return <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <div className="container mx-auto p-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/products"
                element={<PrivateRoute component={ProductList} roles={['user', 'admin']} />}
              />
              <Route
                path="/categories"
                element={<PrivateRoute component={CategoryList} roles={['user', 'admin']} />}
              />
              <Route
                path="/transactions"
                element={<PrivateRoute component={TransactionList} roles={['user', 'admin']} />}
              />
              <Route
                path="/debts"
                element={<PrivateRoute component={DebtManagement} roles={['admin']} />}
              />
              <Route
                path="/debt-list"
                element={<PrivateRoute component={DebtList} roles={['admin']} />}
              />
              <Route
                path="/users"
                element={<PrivateRoute component={UserManagement} roles={['admin']} />}
              />
              <Route path="/logout" element={<Logout />} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
