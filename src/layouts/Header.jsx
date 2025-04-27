import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/css/layout.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <div className="logo-icon">A</div>
          <span className="logo-text">AI Assistant</span>
        </Link>
        
        <nav className="nav-menu">
          <Link to="/" className="nav-link">Trang chủ</Link>
          <Link to="/features" className="nav-link">Tính năng</Link>
          <Link to="/pricing" className="nav-link">Bảng giá</Link>
          <Link to="/about" className="nav-link">Giới thiệu</Link>
          <Link to="/contact" className="nav-link">Liên hệ</Link>
          <button className="nav-button">Dùng thử miễn phí</button>
        </nav>
        
        <button className="menu-toggle">☰</button>
      </div>
    </header>
  );
};

export default Header; 