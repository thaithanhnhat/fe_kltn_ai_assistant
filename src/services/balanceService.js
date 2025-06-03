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

// Hàm để đảm bảo request được thực hiện với token hợp lệ
const securedRequest = async (requestFn) => {
  try {
    // Kiểm tra và refresh token nếu cần
    await authService.checkAndRefreshToken();
    return requestFn();
  } catch (error) {
    // Nếu token không hợp lệ và không thể refresh
    if (error.message.includes('token') || error.response?.status === 401) {
      window.location.href = '/login'; // Chuyển hướng đến trang login
    }
    return Promise.reject(error);
  }
};

const balanceService = {
  // Trừ tiền cố định (520,000 VND) để tạo cửa hàng
  deductFixedAmount: async () => {
    return securedRequest(() => 
      api.post('/api/profile/balance/deduct-fixed').then(response => response.data)
    );
  },

  // Lấy số dư hiện tại
  getCurrentBalance: async () => {
    return securedRequest(() => 
      api.get('/api/profile/balance').then(response => response.data)
    );
  }
};

export default balanceService;
