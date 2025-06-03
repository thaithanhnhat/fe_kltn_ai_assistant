import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../assets/css/auth.css';
import { useAuth } from '../contexts/AuthContext';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resendVerification, verifyToken, forgotPassword, validatePasswordResetToken } = useAuth();
  
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email') || '';
  const token = queryParams.get('token') || '';
  const mode = queryParams.get('mode') || 'register'; // 'register' hoặc 'reset'
  
  const [verificationStatus, setVerificationStatus] = useState(token ? 'verifying' : 'no-token');
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendError, setResendError] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  
  // Sử dụng useRef để theo dõi trạng thái xác minh và tránh gọi API nhiều lần
  const verificationAttempted = useRef(false);

  useEffect(() => {
    // Xử lý xác minh token tự động nếu có token trong URL
    const verifyEmailToken = async () => {
      if (!token || verificationAttempted.current) return;
      
      // Đánh dấu đã cố gắng xác minh để không gọi lại API
      verificationAttempted.current = true;
      
      try {
        if (mode === 'reset') {
          // Sử dụng endpoint đúng cho token đặt lại mật khẩu
          const response = await validatePasswordResetToken(token);
          
          if (response && response.data && response.data.valid) {
            // Nếu token hợp lệ, chuyển hướng đến trang đặt lại mật khẩu
            navigate(`/reset-password?token=${token}&email=${encodeURIComponent(response.data.email || email)}`);
          } else {
            // Nếu token không hợp lệ, chuyển hướng đến trang lỗi
            const errorMessage = response?.data?.message || 'Liên kết đặt lại mật khẩu không hợp lệ';
            const errorCode = response?.data?.reason || 'TOKEN_INVALID';
            navigate(`/reset-password-error?error=${encodeURIComponent(errorMessage)}&code=${errorCode}&email=${encodeURIComponent(email)}`);
          }
        } else {
          // Sử dụng trực tiếp API xác thực token mà không cần kiểm tra trước
          try {
            const verifyResponse = await verifyToken(token);
            
            if (verifyResponse && verifyResponse.data) {
              // Xác minh thành công, chuyển hướng đến trang success
              navigate(`/verification-success?email=${encodeURIComponent(verifyResponse.data.email || email)}`);
            } else {
              // Xác minh thất bại, chuyển hướng đến trang thất bại
              navigate(`/verification-failed?error=${encodeURIComponent('Xác minh email thất bại')}&email=${encodeURIComponent(email)}`);
            }
          } catch (verifyError) {
            // Xử lý lỗi dựa trên response từ API
            const errorMessage = verifyError.response?.data?.error || 'Có lỗi xảy ra khi xác minh email';
            const errorCode = verifyError.response?.data?.reason || '';
            navigate(`/verification-failed?error=${encodeURIComponent(errorMessage)}&code=${errorCode}&email=${encodeURIComponent(email)}`);
          }
        }
      } catch (error) {
        setVerificationStatus('failed');
        setError('Có lỗi xảy ra khi xác minh email. Vui lòng thử lại sau.');
        
        // Nếu có lỗi khi gọi API, chuyển hướng đến trang thất bại
        setTimeout(() => {
          if (mode === 'reset') {
            navigate(`/reset-password-error?error=${encodeURIComponent('Có lỗi xảy ra khi kiểm tra token')}&email=${encodeURIComponent(email)}`);
          } else {
            navigate(`/verification-failed?error=${encodeURIComponent('Có lỗi xảy ra khi xác minh email')}&email=${encodeURIComponent(email)}`);
          }
        }, 2000);
      }
    };

    verifyEmailToken();
  }, [token, email, mode, navigate, verifyToken, validatePasswordResetToken]);

  const handleResendVerification = async () => {
    if (!email) {
      setResendError('Email không được cung cấp');
      return;
    }
    
    setIsResending(true);
    setResendError('');
    
    try {
      if (mode === 'reset') {
        // Gọi API quên mật khẩu để gửi lại email
        await forgotPassword(email);
      } else {
        // Gọi API gửi lại email xác minh cho đăng ký
        await resendVerification(email);
      }
      
      setResendSuccess(true);
      
      // Hiển thị thông báo thành công
      setTimeout(() => {
        setResendSuccess(false);
      }, 5000);
    } catch (error) {
      if (error.response && error.response.data) {
        setResendError(error.response.data.error || 'Không thể gửi lại email');
      } else {
        setResendError('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case 'verifying':
        return (
          <>
            <div className="auth-header">
              <div className="auth-logo">
                <div className="auth-logo-icon">AI</div>
                <span className="auth-logo-text">Assistant</span>
              </div>
              <h1 className="auth-title">Đang xác minh...</h1>
              <p className="auth-subtitle">
                Vui lòng đợi trong khi chúng tôi xác minh {mode === 'reset' ? 'token đặt lại mật khẩu' : 'email'} của bạn
              </p>
            </div>
            
            <div className="verification-loading">
              <div className="loading-spinner"></div>
              <p>Đang xác minh...</p>
            </div>
          </>
        );
        
      case 'success':
        return (
          <>
            <div className="auth-header">
              <div className="auth-logo">
                <div className="auth-logo-icon">A</div>
                <span className="auth-logo-text">AI Assistant</span>
              </div>
              <h1 className="auth-title">Xác minh thành công!</h1>
              <p className="auth-subtitle">
                {mode === 'reset' 
                  ? 'Bạn sẽ được chuyển đến trang đặt lại mật khẩu...' 
                  : 'Email của bạn đã được xác minh. Bạn sẽ được chuyển đến trang đăng nhập...'}
              </p>
            </div>
            
            <div className="success-animation">
              <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
          </>
        );
        
      case 'failed':
        return (
          <>
            <div className="auth-header">
              <div className="auth-logo">
                <div className="auth-logo-icon">A</div>
                <span className="auth-logo-text">AI Assistant</span>
              </div>
              <h1 className="auth-title">Xác minh thất bại</h1>
              <p className="auth-subtitle">
                {error || 'Liên kết xác minh không hợp lệ hoặc đã hết hạn'}
              </p>
            </div>
            
            <div className="failure-animation">
              <svg className="exclamation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="80" height="80">
                <path fill="none" stroke="#ef4444" strokeWidth="2" d="M12,21 L12,21 C7.02943725,21 3,16.9705627 3,12 C3,7.02943725 7.02943725,3 12,3 C16.9705627,3 21,7.02943725 21,12 C21,16.9705627 16.9705627,21 12,21 Z" />
                <line x1="12" y1="8" x2="12" y2="13" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1" fill="#ef4444" />
              </svg>
            </div>
            
            <div className="resend-verification">
              <p>Bạn có muốn gửi lại email {mode === 'reset' ? 'đặt lại mật khẩu' : 'xác minh'} không?</p>
              {resendError && <div className="error-message">{resendError}</div>}
              {resendSuccess && <div className="success-message">Email đã được gửi lại thành công!</div>}
              <button 
                className="auth-btn" 
                onClick={handleResendVerification}
                disabled={isResending}
              >
                {isResending ? 'Đang gửi...' : `Gửi lại email ${mode === 'reset' ? 'đặt lại mật khẩu' : 'xác minh'}`}
              </button>
            </div>
            
            <div className="auth-actions">
              <Link to="/login" className="auth-link">
                Quay lại đăng nhập
              </Link>
            </div>
          </>
        );
        
      case 'no-token':
        return (
          <>
            <div className="auth-header">
              <div className="auth-logo">
                <div className="auth-logo-icon">A</div>
                <span className="auth-logo-text">AI Assistant</span>
              </div>
              <h1 className="auth-title">{mode === 'reset' ? 'Đặt lại mật khẩu' : 'Xác minh Email'}</h1>
              <p className="auth-subtitle">
                {mode === 'reset'
                  ? 'Vui lòng kiểm tra email của bạn để đặt lại mật khẩu'
                  : 'Vui lòng kiểm tra email của bạn để hoàn tất đăng ký'}
              </p>
            </div>
            
            <div className="verification-instructions">
              <div className="email-sent-animation">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 8L12 13L2 8V20H22V8Z" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 8L12 13L22 8" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 4H22V20H2V4Z" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              
              <div className="instruction-steps">
                <p className="instruction-title">Chúng tôi đã gửi email {mode === 'reset' ? 'đặt lại mật khẩu' : 'xác minh'} đến:</p>
                <p className="email-display">{email || 'địa chỉ email của bạn'}</p>
                <p className="instruction-text">
                  Vui lòng kiểm tra hộp thư đến và nhấp vào liên kết trong email.
                </p>
                <p className="instruction-text">
                  <strong>Lưu ý:</strong> Liên kết chỉ có hiệu lực trong <strong>15 phút</strong>.
                </p>
                <p className="instruction-text">
                  Nếu bạn không thấy email, vui lòng kiểm tra thư mục spam/junk.
                </p>
              </div>
            </div>
            
            <div className="resend-verification">
              {resendError && <div className="error-message">{resendError}</div>}
              {resendSuccess && <div className="success-message">Email đã được gửi lại thành công!</div>}
              <button 
                className="auth-btn" 
                onClick={handleResendVerification}
                disabled={isResending}
              >
                {isResending ? 'Đang gửi...' : `Gửi lại email ${mode === 'reset' ? 'đặt lại mật khẩu' : 'xác minh'}`}
              </button>
            </div>
            
            <div className="auth-footer" style={{ marginTop: '1rem' }}>
              <Link to="/login" className="auth-link">Quay lại đăng nhập</Link>
            </div>
          </>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {renderContent()}
      </div>
    </div>
  );
};

export default VerifyEmail; 