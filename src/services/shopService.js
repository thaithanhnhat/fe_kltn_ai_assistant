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

const shopService = {
  // Tạo shop mới
  createShop: async (name) => {
    return securedRequest(() => 
      api.post('/api/shops', { name }).then(response => response.data)
    );
  },
  
  // Lấy tất cả shops của người dùng hiện tại
  getShops: async () => {
    return securedRequest(() => 
      api.get('/api/shops').then(response => response.data)
    );
  },
  
  // Lấy các shop đang hoạt động
  getActiveShops: async () => {
    return securedRequest(() => 
      api.get('/api/shops/active').then(response => response.data)
    );
  },
  
  // Lấy thông tin shop theo ID
  getShopById: async (shopId) => {
    return securedRequest(() => 
      api.get(`/api/shops/${shopId}`).then(response => response.data)
    );
  },
  
  // Cập nhật tên shop
  updateShop: async (shopId, name) => {
    return securedRequest(() => 
      api.put(`/api/shops/${shopId}`, { name }).then(response => response.data)
    );
  },
  
  // Cập nhật trạng thái shop
  updateShopStatus: async (shopId, status) => {
    return securedRequest(() => 
      api.patch(`/api/shops/${shopId}/status`, { status }).then(response => response.data)
    );
  },
  
  // Xóa shop
  deleteShop: async (shopId) => {
    return securedRequest(() => 
      api.delete(`/api/shops/${shopId}`).then(response => response.status === 204)
    );
  }
};

export default shopService; 