import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiArrowLeft, FiHome, FiCreditCard, FiCalendar, FiHash, FiBriefcase, FiDollarSign, FiRefreshCw } from 'react-icons/fi';
import paymentService from '../services/paymentService';
import { useAuth } from '../contexts/AuthContext';
import '../assets/css/payment-result.css';

const PaymentResult = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    handleVNPayCallback();
  }, [location, navigate, isAuthenticated]);
  
  const handleVNPayCallback = async () => {
    const queryParams = new URLSearchParams(location.search);
    const responseCode = queryParams.get('vnp_ResponseCode');
    const orderId = queryParams.get('vnp_TxnRef');
    
    // Kiểm tra xem có phải là callback từ VNPAY không
    if (!responseCode || !orderId) {
      setLoading(false);
      setResult({
        success: false,
        message: 'Không tìm thấy thông tin thanh toán',
        error: 'Mã đơn hàng không hợp lệ hoặc thiếu thông tin'
      });
      return;
    }
    
    try {
      // QUAN TRỌNG: Chuyển đổi tất cả các tham số URL thành đối tượng, giữ nguyên tên tham số
      const callbackData = {};
      queryParams.forEach((value, key) => {
        // Giữ nguyên tên key, không thay đổi định dạng vnp_XXX
        callbackData[key] = value;
      });
      
      console.log('Gửi dữ liệu callback đến backend:', callbackData);
      
      // Gọi API để xử lý kết quả thanh toán
      const response = await paymentService.processVnpayCallback(callbackData);
      
      setResult({
        success: response.status === 'COMPLETED',
        data: response,
        message: response.status === 'COMPLETED' 
          ? 'Thanh toán thành công! Số dư tài khoản của bạn đã được cập nhật.'
          : getErrorMessage(responseCode),
        responseCode: responseCode
      });
    } catch (error) {
      console.error('Lỗi khi xử lý kết quả thanh toán:', error);
      
      // Vẫn hiển thị thông tin nếu có thể lấy được từ callback
      try {
        // Thử lấy thông tin giao dịch từ backend dù xử lý callback thất bại
        const transaction = await paymentService.checkVnpayOrderStatus(orderId);
        setResult({
          success: transaction.status === 'COMPLETED',
          data: transaction,
          message: transaction.status === 'COMPLETED'
            ? 'Thanh toán thành công! Tuy nhiên, có lỗi khi cập nhật số dư. Vui lòng làm mới trang để kiểm tra lại.'
            : getErrorMessage(responseCode),
          error: error.response?.data?.message || error.message,
          responseCode: responseCode
        });
      } catch (fallbackError) {
        // Nếu cả hai cách đều thất bại, hiển thị lỗi
        setResult({
          success: false,
          message: 'Đã xảy ra lỗi khi xử lý thanh toán. Vui lòng liên hệ hỗ trợ.',
          error: error.response?.data?.message || error.message
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  const getErrorMessage = (code) => {
    switch(code) {
      case '01': return 'Giao dịch đã tồn tại';
      case '02': return 'Merchant không hợp lệ';
      case '03': return 'Dữ liệu gửi sang không đúng định dạng';
      case '04': return 'Khởi tạo GD không thành công do Website đang bị tạm khóa';
      case '05': return 'Quý khách nhập sai mật khẩu quá số lần quy định';
      case '06': return 'Quý khách nhập sai mật khẩu';
      case '07': return 'Giao dịch bị nghi ngờ gian lận';
      case '09': return 'Thẻ/Tài khoản của khách hàng bị khóa';
      case '10': return 'Quý khách nhập sai CSC';
      case '11': return 'Tài khoản không đủ số dư để thanh toán';
      case '24': return 'Khách hàng hủy giao dịch';
      case '51': return 'Tài khoản không đủ hạn mức';
      case '65': return 'Tài khoản quý khách đã vượt quá hạn mức giao dịch trong ngày';
      case '75': return 'Ngân hàng thanh toán đang bảo trì';
      case '99': return 'Lỗi không xác định';
      default: return 'Thanh toán thất bại hoặc đã bị hủy';
    }
  };
  
  const goToDashboard = () => {
    navigate('/dashboard');
  };
  
  const goToDeposit = () => {
    navigate('/dashboard', { state: { activeSection: 'deposit' } });
  };
  
  if (loading) {
    return (
      <div className="payment-result-container loading">
        <div className="loading-spinner"></div>
        <h2>Đang xử lý thanh toán...</h2>
        <p>Vui lòng đợi trong giây lát</p>
      </div>
    );
  }
  
  return (
    <div className={`payment-result-container ${result.success ? 'success' : 'failure'}`}>
      <div className="result-header">
        <div className="result-icon">
          {result.success ? (
            <FiCheckCircle className="success-icon" />
          ) : (
            <FiXCircle className="failure-icon" />
          )}
        </div>
        <h1>{result.success ? 'Thanh toán thành công' : 'Thanh toán thất bại'}</h1>
        <p className="result-message">{result.message}</p>
      </div>
      
      {result.data && (
        <div className="payment-details">
          <div className="detail-row">
            <div className="detail-label">
              <FiHash className="detail-icon" /> Mã đơn hàng
            </div>
            <div className="detail-value">{result.data.orderId}</div>
          </div>
          
          <div className="detail-row">
            <div className="detail-label">
              <FiDollarSign className="detail-icon" /> Số tiền
            </div>
            <div className="detail-value">{result.data.amount?.toLocaleString()} VND</div>
          </div>
          
          {result.data.transactionId && (
            <div className="detail-row">
              <div className="detail-label">
                <FiHash className="detail-icon" /> Mã giao dịch VNPAY
              </div>
              <div className="detail-value">{result.data.transactionId}</div>
            </div>
          )}
          
          {result.data.bankCode && (
            <div className="detail-row">
              <div className="detail-label">
                <FiBriefcase className="detail-icon" /> Ngân hàng
              </div>
              <div className="detail-value">{result.data.bankCode}</div>
            </div>
          )}
          
          <div className="detail-row">
            <div className="detail-label">
              <FiCalendar className="detail-icon" /> Ngày giao dịch
            </div>
            <div className="detail-value">
              {result.data.createdAt ? new Date(result.data.createdAt).toLocaleString('vi-VN') : 'N/A'}
            </div>
          </div>
          
          <div className="detail-row">
            <div className="detail-label">
              <FiRefreshCw className="detail-icon" /> Trạng thái
            </div>
            <div className="detail-value status-value">
              <span className={`status-badge ${result.success ? 'success' : 'failure'}`}>
                {result.success ? 'Thành công' : 'Thất bại'}
              </span>
            </div>
          </div>
        </div>
      )}
      
      <div className="result-actions">
        <button onClick={goToDashboard} className="action-btn home-btn">
          <FiHome className="btn-icon" /> Về trang chủ
        </button>
        
        <button onClick={goToDeposit} className="action-btn deposit-btn">
          <FiCreditCard className="btn-icon" /> Nạp tiền tiếp
        </button>
      </div>
      
      {!result.success && result.error && (
        <div className="error-details">
          <div className="error-header">
            <FiAlertTriangle className="error-icon" />
            <h3>Chi tiết lỗi</h3>
          </div>
          <p>{result.error}</p>
          <p className="error-help">Nếu bạn gặp vấn đề, vui lòng liên hệ với chúng tôi để được hỗ trợ.</p>
        </div>
      )}
    </div>
  );
};

export default PaymentResult; 