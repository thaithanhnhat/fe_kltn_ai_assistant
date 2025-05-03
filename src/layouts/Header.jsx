import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../assets/css/layout.css';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const handleLoginClick = () => {
    navigate('/login');
  };
  
  const handleLogoutClick = () => {
    logout();
    navigate('/');
  };
  
  const handleTryFreeClick = () => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <div className="logo-icon">AI</div>
          <span className="logo-text">Assistant</span>
        </Link>
        
        <nav className="nav-menu">
          <Link to="/" className="nav-link">Trang chủ</Link>
          <Link to="/features" className="nav-link">Tính năng</Link>
          <Link to="/pricing" className="nav-link">Bảng giá</Link>
          <Link to="/about" className="nav-link">Giới thiệu</Link>
          <Link to="/contact" className="nav-link">Liên hệ</Link>
          
          {isAuthenticated() ? (
            <>
              <span className="user-greeting">Xin chào, {currentUser?.fullname || 'User'}</span>
              <button className="nav-button" onClick={handleLogoutClick}>Đăng xuất</button>
            </>
          ) : (
            <>
              <button className="nav-button login-button" onClick={handleLoginClick}>Đăng nhập</button>
              <button className="nav-button" onClick={handleTryFreeClick}>Dùng thử miễn phí</button>
            </>
          )}
        </nav>
        
        <button className="menu-toggle">☰</button>
      </div>
    </header>
  );
};

export default Header; 