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

const profileService = {
  // Lấy thông tin Profile người dùng
  getUserProfile: async () => {
    // Kiểm tra và refresh token nếu cần
    try {
      await authService.checkAndRefreshToken();
      return api.get('/api/profile').then(response => response.data);
    } catch (error) {
      // Nếu token không hợp lệ và không thể refresh
      if (error.message.includes('token') || error.response?.status === 401) {
        window.location.href = '/login'; // Chuyển hướng đến trang login
      }
      return Promise.reject(error);
    }
  },
  
  // Lấy số dư tài khoản người dùng (không cần nữa vì đã bao gồm trong profile)
  getUserBalance: async () => {
    // Kiểm tra và refresh token nếu cần
    try {
      await authService.checkAndRefreshToken();
      return api.get('/api/profile/balance').then(response => response.data);
    } catch (error) {
      // Nếu token không hợp lệ và không thể refresh
      if (error.message.includes('token') || error.response?.status === 401) {
        window.location.href = '/login'; // Chuyển hướng đến trang login
      }
      return Promise.reject(error);
    }
  },
  
  // Cập nhật thông tin Profile người dùng
  updateUserProfile: async (profileData) => {
    // Kiểm tra và refresh token nếu cần
    try {
      await authService.checkAndRefreshToken();
      return api.put('/api/profile', profileData).then(response => response.data);
    } catch (error) {
      // Nếu token không hợp lệ và không thể refresh
      if (error.message.includes('token') || error.response?.status === 401) {
        window.location.href = '/login'; // Chuyển hướng đến trang login
      }
      return Promise.reject(error);
    }
  }
};

export default profileService; 