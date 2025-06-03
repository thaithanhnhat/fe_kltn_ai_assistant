import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../assets/css/auth.css';
import { useAuth } from '../contexts/AuthContext';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword } = useAuth();
  
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email') || '';
  const token = queryParams.get('token') || '';
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Kiểm tra token khi component mount
  useEffect(() => {
    if (!token) {
      navigate('/verification-failed?error=Không có token đặt lại mật khẩu. Vui lòng thử lại.');
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        // Gọi API đặt lại mật khẩu
        await resetPassword(token, formData.password, formData.confirmPassword);
        setIsSuccess(true);
        
        // Sau 2 giây, chuyển hướng đến trang đăng nhập
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } catch (error) {
        if (error.response && error.response.data) {
          setErrors({ general: error.response.data.error || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.' });
        } else {
          setErrors({ general: 'Có lỗi xảy ra. Vui lòng thử lại sau.' });
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="auth-logo-icon">AI</div>
              <span className="auth-logo-text">Assistant</span>
            </div>
            <h1 className="auth-title">Mật khẩu đã đặt lại!</h1>
            <p className="auth-subtitle">
              Mật khẩu của bạn đã được đặt lại thành công.
              Bạn sẽ được chuyển đến trang đăng nhập...
            </p>
          </div>
          
          <div className="success-animation">
            <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
              <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-icon">A</div>
            <span className="auth-logo-text">AI Assistant</span>
          </div>
          <h1 className="auth-title">Đặt lại mật khẩu</h1>
          <p className="auth-subtitle">
            Vui lòng nhập mật khẩu mới cho tài khoản của bạn
          </p>
        </div>
        
        <div className="email-info">
          Đặt lại mật khẩu cho
          <div className="email-display">{email}</div>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {errors.general && <div className="error-message">{errors.general}</div>}
          
          <div className="form-group">
            <label className="form-label" htmlFor="password">Mật khẩu mới</label>
            <input
              id="password"
              type="password"
              name="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && <div className="error-message">{errors.password}</div>}
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              className="form-input"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
          </div>
          
          <button 
            type="submit" 
            className="auth-btn" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>
        </form>
        
        <div className="auth-footer">
          <Link to="/login" className="auth-link">Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 