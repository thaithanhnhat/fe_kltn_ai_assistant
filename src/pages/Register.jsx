import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../assets/css/auth.css';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
    rePassword: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    if (!formData.fullname) {
      newErrors.fullname = 'Họ tên là bắt buộc';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    if (!formData.rePassword) {
      newErrors.rePassword = 'Xác nhận mật khẩu là bắt buộc';
    } else if (formData.rePassword !== formData.password) {
      newErrors.rePassword = 'Mật khẩu xác nhận không khớp';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        // Gọi API đăng ký
        await register(formData);
        
        // Chuyển đến trang xác minh email
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}&mode=register`);
      } catch (error) {
        // Xử lý lỗi từ API
        if (error.response) {
          if (error.response.data.error) {
            // Trường hợp lỗi chung
            setErrors({ general: error.response.data.error });
          } else if (typeof error.response.data === 'object') {
            // Trường hợp lỗi validation
            const apiErrors = {};
            for (const key in error.response.data) {
              const fieldName = key === 'password' ? 'password' :
                               key === 'rePassword' ? 'rePassword' :
                               key;
              apiErrors[fieldName] = error.response.data[key];
            }
            setErrors(apiErrors);
          } else {
            setErrors({ general: 'Đăng ký thất bại. Vui lòng thử lại.' });
          }
        } else {
          setErrors({ general: 'Có lỗi xảy ra. Vui lòng thử lại sau.' });
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-icon">AI</div>
            <span className="auth-logo-text">Assistant</span>
          </div>
          <h1 className="auth-title">Đăng ký tài khoản</h1>
          <p className="auth-subtitle">Tạo tài khoản để sử dụng dịch vụ trợ lý ảo AI</p>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {errors.general && <div className="error-message">{errors.general}</div>}
          
          <div className="form-group">
            <label className="form-label" htmlFor="fullname">Họ tên</label>
            <input
              id="fullname"
              type="text"
              name="fullname"
              className="form-input"
              placeholder="Nguyễn Văn A"
              value={formData.fullname}
              onChange={handleChange}
            />
            {errors.fullname && <div className="error-message">{errors.fullname}</div>}
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              className="form-input"
              placeholder="email@example.com"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="password">Mật khẩu</label>
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
            <label className="form-label" htmlFor="rePassword">Xác nhận mật khẩu</label>
            <input
              id="rePassword"
              type="password"
              name="rePassword"
              className="form-input"
              placeholder="••••••••"
              value={formData.rePassword}
              onChange={handleChange}
            />
            {errors.rePassword && <div className="error-message">{errors.rePassword}</div>}
          </div>
          
          <button 
            type="submit" 
            className="auth-btn" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>
        
        <div className="auth-footer">
          Đã có tài khoản? <Link to="/login" className="auth-link">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default Register; 