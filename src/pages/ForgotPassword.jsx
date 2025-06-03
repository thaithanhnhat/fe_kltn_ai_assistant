import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../assets/css/auth.css';
import { useAuth } from '../contexts/AuthContext';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    setError('');
  };

  const validateForm = () => {
    if (!email) {
      setError('Email là bắt buộc');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email không hợp lệ');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        // Gọi API quên mật khẩu
        await forgotPassword(email);
        
        setIsSubmitted(true);
        
        // Sau 2 giây, chuyển hướng tới trang hướng dẫn kiểm tra email
        setTimeout(() => {
          navigate(`/verify-email?email=${encodeURIComponent(email)}&mode=reset`);
        }, 2000);
      } catch (error) {
        if (error.response && error.response.data) {
          setError(error.response.data.error || 'Không thể gửi yêu cầu. Vui lòng thử lại sau.');
        } else {
          setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isSubmitted) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="auth-logo-icon">AI</div>
              <span className="auth-logo-text">Assistant</span>
            </div>
            <h1 className="auth-title">Kiểm tra Email của bạn</h1>
            <p className="auth-subtitle">
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn.
              Vui lòng kiểm tra hòm thư đến để tiếp tục.
            </p>
          </div>
          
          <div className="email-sent-animation">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 8L12 13L2 8V20H22V8Z" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 8L12 13L22 8" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 4H22V20H2V4Z" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <p className="email-note">
            Đã gửi đến: <strong>{email}</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-icon">AI</div>
            <span className="auth-logo-text">Assistant</span>
          </div>
          <h1 className="auth-title">Quên mật khẩu?</h1>
          <p className="auth-subtitle">
            Vui lòng nhập địa chỉ email của bạn. Chúng tôi sẽ gửi liên kết
            để đặt lại mật khẩu của bạn.
          </p>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="email@example.com"
              value={email}
              onChange={handleChange}
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-btn" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang xử lý...' : 'Gửi liên kết đặt lại'}
          </button>
        </form>
        
        <div className="auth-footer">
          <Link to="/login" className="auth-link">Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 