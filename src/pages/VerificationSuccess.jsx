import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../assets/css/auth.css';

const VerificationSuccess = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email') || '';

  useEffect(() => {
    // Có thể thêm analytics hoặc xử lý khác ở đây
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-icon">AI</div>
            <span className="auth-logo-text">Assistant</span>
          </div>
          <h1 className="auth-title">Xác minh thành công!</h1>
          <p className="auth-subtitle">
            Email của bạn đã được xác minh thành công. Bây giờ bạn có thể đăng nhập vào tài khoản của mình.
          </p>
        </div>
        
        <div className="success-animation">
          <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
            <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
        
        {email && (
          <p className="email-note">
            Tài khoản: <strong>{email}</strong>
          </p>
        )}
        
        <div className="auth-actions">
          <Link to="/login" className="auth-btn">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerificationSuccess; 