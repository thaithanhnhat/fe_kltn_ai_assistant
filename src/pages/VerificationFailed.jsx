import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../assets/css/auth.css';
import { useAuth } from '../contexts/AuthContext';

const VerificationFailed = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const error = queryParams.get('error') || 'Liên kết xác minh không hợp lệ hoặc đã hết hạn';
  const email = queryParams.get('email') || '';
  const code = queryParams.get('code') || '';
  
  const [isResending, setIsResending] = useState(false);
  const [resendError, setResendError] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  
  const { resendVerification } = useAuth();

  const handleResendVerification = async () => {
    if (!email) {
      setResendError('Email không được cung cấp');
      return;
    }
    
    setIsResending(true);
    setResendError('');
    
    try {
      await resendVerification(email);
      setResendSuccess(true);
      
      // Chuyển hướng sau 3 giây
      setTimeout(() => {
        navigate(`/verify-email?email=${encodeURIComponent(email)}&mode=register`);
      }, 3000);
    } catch (error) {
      if (error.response && error.response.data) {
        setResendError(error.response.data.error || 'Không thể gửi lại email xác minh');
      } else {
        setResendError('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    } finally {
      setIsResending(false);
    }
  };

  // Hiển thị thông báo dựa trên mã lỗi
  const renderErrorMessage = () => {
    switch (code) {
      case 'TOKEN_EXPIRED':
        return (
          <div className="error-block error-expired">
            <h3>Link xác minh đã hết hạn</h3>
            <p>Link xác minh chỉ có hiệu lực trong 15 phút.</p>
            <p>Vui lòng yêu cầu gửi lại email xác minh.</p>
          </div>
        );
      case 'TOKEN_INVALID':
        return (
          <div className="error-block error-invalid">
            <h3>Link xác minh không hợp lệ</h3>
            <p>Link xác minh không chính xác hoặc đã bị hủy.</p>
          </div>
        );
      case 'TOKEN_USED':
        return (
          <div className="error-block error-used">
            <h3>Link xác minh đã được sử dụng</h3>
            <p>Tài khoản này đã được xác minh trước đó.</p>
            <p>Vui lòng đăng nhập với email và mật khẩu đã đăng ký.</p>
          </div>
        );
      case 'USER_REGISTERED':
        return (
          <div className="error-block error-registered">
            <h3>Tài khoản đã được xác minh</h3>
            <p>Email này đã được đăng ký và xác minh trước đó.</p>
            <p>Vui lòng đăng nhập với email và mật khẩu đã đăng ký.</p>
          </div>
        );
      default:
        return <p className="error-message default-error">{error}</p>;
    }
  };

  // Xác định xem có nên hiển thị nút gửi lại email không
  const shouldShowResendButton = () => {
    return code === 'TOKEN_EXPIRED' || code === 'TOKEN_INVALID' || !code;
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-icon">AI</div>
            <span className="auth-logo-text">Assistant</span>
          </div>
          <h1 className="auth-title">Xác minh thất bại</h1>
        </div>
        
        {!resendSuccess ? (
          <>
            <div className="failure-animation">
              <svg className="exclamation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="80" height="80">
                <path fill="none" stroke="#ef4444" strokeWidth="2" d="M12,21 L12,21 C7.02943725,21 3,16.9705627 3,12 C3,7.02943725 7.02943725,3 12,3 C16.9705627,3 21,7.02943725 21,12 C21,16.9705627 16.9705627,21 12,21 Z" />
                <line x1="12" y1="8" x2="12" y2="13" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1" fill="#ef4444" />
              </svg>
            </div>
            
            <div className="error-message-container">
              {renderErrorMessage()}
            </div>
            
            {email && shouldShowResendButton() && (
              <div className="resend-verification">
                <p>Bạn có muốn gửi lại email xác minh không?</p>
                {resendError && <div className="error-message">{resendError}</div>}
                <button 
                  className="auth-btn" 
                  onClick={handleResendVerification}
                  disabled={isResending}
                >
                  {isResending ? 'Đang gửi...' : 'Gửi lại email xác minh'}
                </button>
              </div>
            )}
            
            <div className="auth-footer">
              <Link to="/login" className="auth-link">Quay lại đăng nhập</Link>
            </div>
          </>
        ) : (
          <div className="success-notification">
            <div className="success-animation">
              <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <p>Email xác minh đã được gửi lại thành công. Vui lòng kiểm tra hộp thư đến của bạn.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationFailed; 