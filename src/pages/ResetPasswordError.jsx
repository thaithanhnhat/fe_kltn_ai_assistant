import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../assets/css/auth.css';
import { useAuth } from '../contexts/AuthContext';

const ResetPasswordError = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const error = queryParams.get('error') || 'Đã xảy ra lỗi khi đặt lại mật khẩu';
  const code = queryParams.get('code') || '';
  const email = queryParams.get('email') || '';
  
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  
  const { forgotPassword } = useAuth();

  const handleResendEmail = async () => {
    if (!email) {
      setResendError('Email không được cung cấp');
      return;
    }
    
    setIsResending(true);
    setResendError('');
    
    try {
      await forgotPassword(email);
      setResendSuccess(true);
    } catch (error) {
      if (error.response && error.response.data) {
        setResendError(error.response.data.error || 'Không thể gửi lại email đặt lại mật khẩu');
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
            <h3>Link đặt lại mật khẩu đã hết hạn</h3>
            <p>Link đặt lại mật khẩu chỉ có hiệu lực trong 15 phút.</p>
            <p>Vui lòng yêu cầu gửi lại email đặt lại mật khẩu.</p>
          </div>
        );
      case 'TOKEN_INVALID':
        return (
          <div className="error-block error-invalid">
            <h3>Link đặt lại mật khẩu không hợp lệ</h3>
            <p>Link đặt lại mật khẩu không chính xác hoặc đã bị hủy.</p>
          </div>
        );
      case 'TOKEN_USED':
        return (
          <div className="error-block error-used">
            <h3>Link đặt lại mật khẩu đã được sử dụng</h3>
            <p>Link này đã được sử dụng trước đó.</p>
            <p>Vui lòng yêu cầu link đặt lại mật khẩu mới nếu bạn cần đặt lại mật khẩu.</p>
          </div>
        );
      default:
        return <p className="error-message default-error">{error}</p>;
    }
  };

  // Xác định xem có nên hiển thị nút gửi lại email không
  const shouldShowResendButton = () => {
    return code === 'TOKEN_EXPIRED' || code === 'TOKEN_INVALID' || code === 'TOKEN_USED' || !code;
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-icon">AI</div>
            <span className="auth-logo-text">Assistant</span>
          </div>
          <h1 className="auth-title">Lỗi đặt lại mật khẩu</h1>
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
                <p>Bạn có muốn gửi lại email đặt lại mật khẩu không?</p>
                {resendError && <div className="error-message">{resendError}</div>}
                <button 
                  className="auth-btn" 
                  onClick={handleResendEmail}
                  disabled={isResending}
                >
                  {isResending ? 'Đang gửi...' : 'Gửi lại email đặt lại mật khẩu'}
                </button>
              </div>
            )}
            
            <div className="auth-footer">
              <Link to="/forgot-password" className="auth-link">Quay lại trang quên mật khẩu</Link>
            </div>
            
            <div className="auth-footer" style={{ marginTop: '0.5rem' }}>
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
            <p>Email đặt lại mật khẩu đã được gửi lại thành công. Vui lòng kiểm tra hộp thư đến của bạn.</p>
            <p className="email-note">
              Đã gửi đến: <strong>{email}</strong>
            </p>
            <div className="auth-footer" style={{ marginTop: '1rem' }}>
              <Link to="/login" className="auth-link">Quay lại đăng nhập</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordError; 