import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../assets/css/auth.css';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email') || '';
  const mode = queryParams.get('mode') || 'register'; // 'register' hoặc 'reset'
  
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const inputRefs = Array(6).fill(0).map(() => React.createRef());

  useEffect(() => {
    // Focus on first input when component mounts
    if (inputRefs[0] && inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    
    // Auto-focus to next input
    if (value && index < 5 && inputRefs[index + 1] && inputRefs[index + 1].current) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0 && inputRefs[index - 1] && inputRefs[index - 1].current) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    
    const pastedData = e.clipboardData.getData('text/plain').trim();
    if (!pastedData.match(/^\d+$/) || pastedData.length > 6) return;
    
    const digits = pastedData.split('').slice(0, 6);
    const newCode = [...verificationCode];
    
    digits.forEach((digit, index) => {
      if (index < 6) {
        newCode[index] = digit;
      }
    });
    
    setVerificationCode(newCode);
    
    // Focus on the input after the last pasted digit
    const lastFilledIndex = Math.min(digits.length, 5);
    if (inputRefs[lastFilledIndex] && inputRefs[lastFilledIndex].current) {
      inputRefs[lastFilledIndex].current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const code = verificationCode.join('');
    if (code.length !== 6) {
      setError('Vui lòng nhập đầy đủ mã xác minh gồm 6 chữ số');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Mô phỏng xác minh thành công
      setTimeout(() => {
        setIsSuccess(true);
        
        // Chuyển hướng dựa vào mode
        setTimeout(() => {
          if (mode === 'reset') {
            navigate('/reset-password?email=' + encodeURIComponent(email));
          } else {
            navigate('/login');
          }
        }, 2000);
      }, 1500);
    } catch (error) {
      setError('Mã xác minh không hợp lệ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = () => {
    setCountdown(60); // 60 seconds cooldown
    // Mô phỏng gửi lại mã
    setTimeout(() => {
      // Code sent successfully
    }, 1000);
  };

  if (isSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card">
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
          <h1 className="auth-title">Xác minh Email</h1>
          <p className="auth-subtitle">
            {mode === 'reset'
              ? 'Nhập mã xác minh đã được gửi đến email của bạn để đặt lại mật khẩu'
              : 'Nhập mã xác minh đã được gửi đến email của bạn để hoàn tất đăng ký'}
          </p>
        </div>
        
        <div className="email-info">
          Chúng tôi đã gửi mã 6 chữ số đến
          <div className="email-display">{email}</div>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="verification-code-container">
            {verificationCode.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                maxLength="1"
                className="verification-input"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
              />
            ))}
          </div>
          
          <button
            type="submit"
            className="auth-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang xác minh...' : 'Xác minh Email'}
          </button>
        </form>
        
        <div className="resend-code">
          Không nhận được mã? {' '}
          {countdown > 0 ? (
            <span className="countdown">Gửi lại sau {countdown}s</span>
          ) : (
            <button 
              className="resend-button" 
              onClick={handleResendCode}
              disabled={countdown > 0}
            >
              Gửi lại mã
            </button>
          )}
        </div>
        
        <div className="auth-footer">
          <Link to="/login" className="auth-link">Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 