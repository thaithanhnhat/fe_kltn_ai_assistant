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

const telegramService = {
  // Kiểm tra trạng thái bot
  getBotStatus: async (shopId) => {
    return securedRequest(() => 
      api.get(`/api/shops/${shopId}/telegram/status`).then(response => response.data)
    );
  },

  // Khởi động bot Telegram
  startBot: async (shopId) => {
    return securedRequest(() => 
      api.post(`/api/shops/${shopId}/telegram/start`).then(response => response.data)
    );
  },

  // Dừng bot Telegram
  stopBot: async (shopId) => {
    return securedRequest(() => 
      api.post(`/api/shops/${shopId}/telegram/stop`).then(response => response.data)
    );
  },

  // Lấy danh sách tin nhắn gần đây
  getMessages: async (shopId, limit = 50) => {
    return securedRequest(() => 
      api.get(`/api/shops/${shopId}/telegram/messages?limit=${limit}`).then(response => response.data)
    );
  },

  // Gửi tin nhắn
  sendMessage: async (shopId, chatId, message) => {
    return securedRequest(() => 
      api.post(`/api/shops/${shopId}/telegram/send`, {
        chatId,
        message
      }).then(response => response.data)
    );
  }
};

export default telegramService; 