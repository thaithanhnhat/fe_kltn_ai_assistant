import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/css/layout.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>AI Assistant</h3>
          <p>Giải pháp trợ lý ảo thông minh cho doanh nghiệp của bạn trên nhiều nền tảng khác nhau.</p>
          <div className="social-links">
            <a href="#" className="social-link">F</a>
            <a href="#" className="social-link">T</a>
            <a href="#" className="social-link">L</a>
            <a href="#" className="social-link">I</a>
          </div>
        </div>
        
        <div className="footer-section">
          <h3>Sản phẩm</h3>
          <ul className="footer-links">
            <li><Link to="/features">Tính năng</Link></li>
            <li><Link to="/pricing">Bảng giá</Link></li>
            <li><Link to="/testimonials">Khách hàng</Link></li>
            <li><Link to="/integrations">Tích hợp</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Hỗ trợ</h3>
          <ul className="footer-links">
            <li><Link to="/documentation">Tài liệu</Link></li>
            <li><Link to="/faq">Câu hỏi thường gặp</Link></li>
            <li><Link to="/support">Trung tâm hỗ trợ</Link></li>
            <li><Link to="/contact">Liên hệ</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Công ty</h3>
          <ul className="footer-links">
            <li><Link to="/about">Giới thiệu</Link></li>
            <li><Link to="/careers">Tuyển dụng</Link></li>
            <li><Link to="/privacy">Chính sách bảo mật</Link></li>
            <li><Link to="/terms">Điều khoản sử dụng</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2024 AI Assistant. Tất cả các quyền được bảo lưu.</p>
      </div>
    </footer>
  );
};

export default Footer; 