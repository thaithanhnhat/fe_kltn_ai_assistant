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

const integrationTokenService = {
  // Thêm token mới
  addToken: async (accessToken, method, shopId) => {
    return securedRequest(() => 
      api.post('/api/integration/tokens', { 
        accessToken, 
        method,
        shopId: shopId || null
      }).then(response => response.data)
    );
  },
  
  // Lấy tất cả tokens
  getTokens: async () => {
    return securedRequest(() => 
      api.get('/api/integration/tokens').then(response => response.data)
    );
  },
  
  // Lấy tokens theo shop ID
  getTokensByShopId: async (shopId) => {
    return securedRequest(() => 
      api.get(`/api/integration/tokens/shop/${shopId}`).then(response => response.data)
    );
  },
  
  // Lấy token theo ID
  getTokenById: async (tokenId) => {
    return securedRequest(() => 
      api.get(`/api/integration/tokens/${tokenId}`).then(response => response.data)
    );
  },
  
  // Lấy tokens theo phương thức (FACEBOOK, TELEGRAM)
  getTokensByMethod: async (method) => {
    return securedRequest(() => 
      api.get(`/api/integration/tokens/method/${method}`).then(response => response.data)
    );
  },
  
  // Cập nhật trạng thái token
  updateTokenStatus: async (tokenId, status) => {
    return securedRequest(() => 
      api.patch(`/api/integration/tokens/${tokenId}/status`, { status }).then(response => response.data)
    );
  },
  
  // Xóa token
  deleteToken: async (tokenId) => {
    return securedRequest(() => 
      api.delete(`/api/integration/tokens/${tokenId}`).then(response => response.status === 204)
    );
  },
  
  // FACEBOOK MESSENGER INTEGRATION
  
  // Cấu hình webhook cho Facebook Messenger
  configureFacebookWebhook: async (shopId) => {
    return securedRequest(() => 
      api.post(`/api/facebook/shops/${shopId}/configure`).then(response => response.data)
    );
  },
  
  // Lưu Facebook Page Access Token
  saveFacebookAccessToken: async (shopId, accessToken, pageId) => {
    if (!pageId) {
      return Promise.reject(new Error('Page ID là bắt buộc để cấu hình Facebook Bot'));
    }
    
    return securedRequest(() => 
      api.post(`/api/facebook/shops/${shopId}/access-token?accessToken=${encodeURIComponent(accessToken)}&pageId=${encodeURIComponent(pageId)}`)
      .then(response => response.data)
    );
  },
  
  // Bắt đầu Facebook Bot
  startFacebookBot: async (shopId) => {
    return securedRequest(() => 
      api.post(`/api/facebook/shops/${shopId}/start`).then(response => response.data)
    );
  },
  
  // Kiểm tra trạng thái Facebook Bot
  checkFacebookBotStatus: async (shopId) => {
    return securedRequest(() => 
      api.get(`/api/facebook/shops/${shopId}/status`).then(response => response.data)
    );
  },
  
  // Dừng Facebook Bot
  stopFacebookBot: async (shopId) => {
    return securedRequest(() => 
      api.post(`/api/facebook/shops/${shopId}/stop`).then(response => response.data)
    );
  }
};

export default integrationTokenService; 