import axios from 'axios';
import * as tokenUtils from '../utils/tokenUtils';
import authService from './authService';

const API_URL = 'http://localhost:8080/assistant';

// Tạo instance axios với URL cơ sở
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Timeout sau 10 giây
});

// Thêm interceptor để xử lý token trong headers
api.interceptors.request.use(
  (config) => {
    const token = tokenUtils.getAccessToken();
    const tokenType = tokenUtils.getTokenType();
    
    if (token) {
      config.headers.Authorization = `${tokenType} ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Hàm wrapper để kiểm tra token trước khi thực hiện request
const securedRequest = async (requestFunc) => {
  try {
    // Kiểm tra và refresh token nếu cần
    await authService.checkAndRefreshToken();
    return await requestFunc();
  } catch (error) {
    // Nếu token không hợp lệ và không thể refresh
    if (error.message.includes('token') || error.response?.status === 401) {
      window.location.href = '/login'; // Chuyển hướng đến trang login
    }
    return Promise.reject(error);
  }
};

const paymentService = {
  // Tạo yêu cầu thanh toán mới
  createPayment: async (amount, currency = 'BNB') => {
    return securedRequest(() => 
      api.post('/api/payments', {
        amount,
        currency
      }).then(response => {
        // Đảm bảo dữ liệu trả về có định dạng phù hợp
        const payment = response.data;
        return {
          ...payment,
          // Thiết lập các giá trị mặc định nếu API không trả về
          walletAddress: payment.walletAddress || payment.depositAddress,
          expectedAmount: payment.expectedAmount || payment.amount,
          expectedAmountVnd: payment.expectedAmountVnd || 0,
          currentBnbPriceUsd: payment.currentBnbPriceUsd || 0
        };
      })
    );
  },
  
  // Tạo yêu cầu thanh toán qua VNPAY
  createVnpayPayment: async (amount, description = "Nạp tiền vào tài khoản", bankCode = "") => {
    return securedRequest(() => 
      api.post('/api/vnpay/create-payment', {
        amount,
        description,
        bankCode,
        language: 'vn'
      }).then(response => response.data)
    );
  },
  
  // Kiểm tra trạng thái thanh toán
  getPaymentStatus: async (paymentId) => {
    return securedRequest(() => 
      api.get(`/api/payments/${paymentId}`).then(response => response.data)
    );
  },
  
  // Kiểm tra thủ công trạng thái thanh toán
  checkPaymentStatus: async (paymentId) => {
    return securedRequest(() => 
      api.post(`/api/payments/${paymentId}/check`).then(response => {
        // Đảm bảo dữ liệu trả về có định dạng phù hợp
        const payment = response.data;
        return {
          ...payment,
          // Thiết lập các giá trị mặc định nếu API không trả về
          walletAddress: payment.walletAddress || payment.depositAddress,
          expectedAmount: payment.expectedAmount || payment.amount,
          expectedAmountVnd: payment.expectedAmountVnd || 0,
          currentBnbPriceUsd: payment.currentBnbPriceUsd || 0
        };
      })
    );
  },
  
  // Kiểm tra trạng thái thanh toán VNPAY theo orderId
  checkVnpayOrderStatus: async (orderId) => {
    return securedRequest(() =>
      api.get(`/api/vnpay/transactions/order/${orderId}`).then(response => response.data)
    );
  },
  
  // Lấy danh sách thanh toán của người dùng
  getUserPayments: async () => {
    return securedRequest(() => 
      api.get('/api/payments').then(response => {
        // Đảm bảo dữ liệu trả về có định dạng phù hợp
        const payments = response.data;
        return payments.map(payment => ({
          ...payment,
          // Thiết lập các giá trị mặc định nếu API không trả về
          walletAddress: payment.walletAddress || payment.depositAddress,
          expectedAmount: payment.expectedAmount || payment.amount,
          expectedAmountVnd: payment.expectedAmountVnd || 0,
          currentBnbPriceUsd: payment.currentBnbPriceUsd || 0
        }));
      })
    );
  },
  
  // Lấy danh sách giao dịch VNPAY của người dùng
  getVnpayTransactions: async () => {
    return securedRequest(() =>
      api.get('/api/vnpay/transactions').then(response => response.data)
    );
  },
  
  // Xem giao dịch blockchain của thanh toán
  getPaymentTransactions: async (paymentId) => {
    return securedRequest(() => 
      api.get(`/api/payments/${paymentId}/transactions`).then(response => response.data)
    );
  },

  // Xử lý callback từ VNPAY
  processVnpayCallback: async (callbackData) => {
    console.log('Sending VNPAY callback data to backend:', callbackData);
    
    return securedRequest(() =>
      api.post('/api/vnpay/process-callback', callbackData).then(response => {
        console.log('VNPAY callback response from backend:', response.data);
        return response.data;
      }).catch(error => {
        console.error('Error in VNPAY callback processing:', error.response?.data || error.message);
        throw error;
      })
    );
  }
};

export default paymentService; 