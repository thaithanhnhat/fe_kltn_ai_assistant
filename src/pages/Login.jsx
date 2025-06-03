import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../assets/css/auth.css';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, resendVerification, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  // Kiểm tra nếu người dùng đã đăng nhập, chuyển hướng đến trang chủ
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/');
    }
    
    // Check for URL parameters (e.g., if redirected from email verification)
    const params = new URLSearchParams(location.search);
    const verified = params.get('verified');
    
    if (verified === 'true') {
      setErrors({ success: 'Email đã được xác minh thành công. Vui lòng đăng nhập.' });
    }
    
  }, [navigate, isAuthenticated, location]);

  // Thêm đếm ngược cho rate limit
  useEffect(() => {
    let timer;
    
    if (retryAfter > 0) {
      timer = setTimeout(() => {
        setRetryAfter(prevTime => {
          if (prevTime <= 1) {
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [retryAfter]);

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
    
    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      setShowResend(false);
      
      try {
        // Gọi API đăng nhập
        await login(formData.email, formData.password);
        
        // Chuyển hướng đến trang dashboard sau khi đăng nhập
        navigate('/dashboard');
      } catch (error) {
        console.error("Login error:", error);
        
        // Xử lý lỗi từ API dựa trên status code và thông báo lỗi
        if (error.response) {
          const status = error.response.status;
          const errorData = error.response.data || {};
          const errorCode = errorData.error || '';
          const errorMessage = errorData.message || '';
          
          switch (status) {
            case 400: // Bad Request
              if (errorCode === 'missing_credentials') {
                setErrors({ general: errorMessage || 'Vui lòng cung cấp email và mật khẩu' });
              } else {
                setErrors({ general: errorMessage || 'Dữ liệu không hợp lệ' });
              }
              break;
            case 401: // Unauthorized
              if (errorCode === 'invalid_credentials') {
                setErrors({ 
                  password: errorMessage || 'Mật khẩu không chính xác',
                  general: errorMessage || 'Mật khẩu không chính xác'
                });
              } else if (errorCode === 'token_expired' || errorCode === 'invalid_token') {
                setErrors({ general: errorMessage || 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' });
              } else {
                setErrors({ general: errorMessage || 'Email hoặc mật khẩu không chính xác' });
              }
              break;
              
            case 403: // Forbidden
              if (errorCode === 'email_not_verified') {
                setErrors({ 
                  general: errorMessage || 'Email chưa được xác minh. Vui lòng kiểm tra hộp thư để xác minh email.'
                });
                setShowResend(true);
              } else {
                setErrors({ general: errorMessage || 'Tài khoản của bạn không có quyền truy cập' });
              }
              break;
              
            case 404: // Not Found
              if (errorCode === 'user_not_found') {
                setErrors({ 
                  email: errorMessage || 'Email không tồn tại trong hệ thống',
                  general: errorMessage || 'Email không tồn tại trong hệ thống'
                });
              } else {
                setErrors({ general: errorMessage || 'Không tìm thấy tài nguyên yêu cầu' });
              }
              break;
              
            case 429: // Too Many Requests
              const retryAfterSecs = errorData.retryAfter || 300; // Default to 5 minutes
              setRetryAfter(retryAfterSecs);
              
              setErrors({ 
                general: errorMessage || `Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau.`
              });
              break;
              
            case 500: case 502: case 503: case 504: // Server errors
              setErrors({ general: errorMessage || 'Lỗi máy chủ. Vui lòng thử lại sau.' });
              break;
              
            case 409: // Conflict
              if (errorCode === 'email_already_exists') {
                setErrors({ 
                  email: errorMessage || 'Email đã được sử dụng bởi một tài khoản khác',
                  general: errorMessage || 'Email đã được sử dụng bởi một tài khoản khác'
                });
              } else {
                setErrors({ general: errorMessage || 'Đã xảy ra xung đột dữ liệu' });
              }
              break;
              
            default:
              setErrors({ general: errorMessage || 'Đăng nhập thất bại. Vui lòng thử lại.' });
          }
        } else if (error.request) {
          // Lỗi không nhận được response
          setErrors({ general: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.' });
        } else {
          // Lỗi trong quá trình thiết lập request
          setErrors({ general: error.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.' });
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      setErrors({ general: 'Vui lòng nhập email trước khi gửi lại email xác minh' });
      return;
    }
    
    try {
      setIsSubmitting(true);
      const response = await resendVerification(formData.email);
      
      // Hiển thị thông báo thành công từ backend
      setErrors({ 
        success: response.message || 'Email xác minh đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.'
      });
      
      // Chuyển hướng sau 3 giây
      setTimeout(() => {
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}&mode=register`);
      }, 3000);
    } catch (error) {
      console.error("Resend verification error:", error);
      
      if (error.response) {
        const errorData = error.response.data || {};
        const errorMessage = errorData.message || 'Không thể gửi lại email xác minh. Vui lòng thử lại sau.';
        const errorCode = errorData.error || '';
        
        // Xử lý lỗi cụ thể
        if (errorCode === 'already_verified') {
          setErrors({ general: errorMessage || 'Email này đã được xác minh. Bạn có thể đăng nhập ngay bây giờ.' });
        } else {
          setErrors({ general: errorMessage });
        }
      } else if (error.request) {
        setErrors({ general: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.' });
      } else {
        setErrors({ general: error.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeRemaining = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-icon">AI</div>
            <span className="auth-logo-text">Assistant</span>
          </div>
          <h1 className="auth-title">Đăng nhập</h1>
          <p className="auth-subtitle">Đăng nhập để sử dụng dịch vụ trợ lý ảo AI</p>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {errors.success && (
            <div className="success-message">{errors.success}</div>
          )}
          
          {errors.general && (
            <div className="error-container">
              <div className="error-message">{errors.general}</div>
              {retryAfter > 0 && (
                <div className="countdown-message">
                  Vui lòng thử lại sau: {formatTimeRemaining(retryAfter)}
                </div>
              )}
              {showResend && (
                <button 
                  type="button" 
                  className="resend-button auth-link"
                  onClick={handleResendVerification}
                  disabled={isSubmitting}
                  style={{ marginTop: '8px', display: 'block' }}
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi lại email xác minh'}
                </button>
              )}
            </div>
          )}
          
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
              autoComplete="email"
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
              autoComplete="current-password"
            />
            {errors.password && <div className="error-message">{errors.password}</div>}
          </div>
          
          <Link to="/forgot-password" className="forgot-password">Quên mật khẩu?</Link>
          
          <button 
            type="submit" 
            className="auth-btn" 
            disabled={isSubmitting || retryAfter > 0}
          >
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        
        <div className="auth-footer">
          Chưa có tài khoản? <Link to="/register" className="auth-link">Đăng ký</Link>
        </div>
      </div>
    </div>
  );
};

export default Login; 