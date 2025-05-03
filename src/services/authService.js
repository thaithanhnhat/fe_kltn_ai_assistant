import axios from 'axios';
import * as tokenUtils from '../utils/tokenUtils';

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

// Interceptor để xử lý refresh token khi token hết hạn
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Nếu lỗi 401 (Unauthorized) và chưa thử refresh token
    if (error.response?.status === 401 && 
        (error.response?.data?.error === 'token_expired' || error.response?.data?.error === 'invalid_token') && 
        !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Kiểm tra refreshToken có tồn tại không
        if (!tokenUtils.hasRefreshToken()) {
          // Nếu không có refresh token, đăng xuất người dùng
          authService.logout();
          return Promise.reject(new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'));
        }
        
        // Thực hiện refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/api/auth/refresh-token`, {
          refreshToken,
        });
        
        const { accessToken, refreshToken: newRefreshToken, tokenType, expiresIn } = response.data;
        
        // Lưu token mới
        tokenUtils.saveTokens(accessToken, newRefreshToken, tokenType, expiresIn);
        
        // Cập nhật header cho request gốc
        api.defaults.headers.common.Authorization = `${tokenType} ${accessToken}`;
        originalRequest.headers.Authorization = `${tokenType} ${accessToken}`;
        
        // Thực hiện lại request gốc
        return api(originalRequest);
      } catch (refreshError) {
        // Nếu refresh token cũng hết hạn, đăng xuất người dùng
        tokenUtils.clearTokens();
        return Promise.reject(new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'));
      }
    }
    
    // Xử lý lỗi cụ thể
    let errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
    
    if (error.response) {
      // Lỗi từ server (có response)
      errorMessage = error.response.data?.message || 
                    `Lỗi ${error.response.status}: ${error.response.statusText}`;
    } else if (error.request) {
      // Lỗi mạng (không có response)
      errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.';
    }
    
    error.message = errorMessage;
    return Promise.reject(error);
  }
);

const authService = {
  // Đăng ký người dùng
  register: async (userData) => {
    return api.post('/api/auth/register', userData);
  },
  
  // Gửi lại email xác minh
  resendVerification: async (email) => {
    return api.post('/api/auth/resend-verification', { email });
  },
  
  // Kiểm tra tính hợp lệ của token xác minh
  checkToken: async (token) => {
    return api.get(`/api/auth/check-token?token=${token}`);
  },
  
  // Xác thực email với token
  verifyToken: async (token) => {
    // Cache tĩnh để lưu kết quả của các yêu cầu trước đó
    if (!authService.verifyTokenCache) {
      authService.verifyTokenCache = {};
    }
    
    // Nếu đã có kết quả cho token này trong cache, trả về kết quả đã lưu
    if (authService.verifyTokenCache[token]) {
      return authService.verifyTokenCache[token];
    }
    
    // Gọi API nếu chưa có kết quả trong cache
    const response = await api.post(`/api/auth/verify-token?token=${token}`);
    
    // Lưu kết quả vào cache
    authService.verifyTokenCache[token] = response;
    
    return response;
  },
  
  // Kiểm tra tính hợp lệ của token đặt lại mật khẩu
  validatePasswordResetToken: async (token) => {
    return api.get(`/api/password/validate-token?token=${token}`);
  },
  
  // Đăng nhập
  login: async (credentials) => {
    try {
      const response = await api.post('/api/auth/login', credentials);
      const data = response.data;
      
      // Lưu thông tin người dùng và token vào localStorage
      if (data.accessToken) {
        tokenUtils.saveTokens(
          data.accessToken, 
          data.refreshToken, 
          data.tokenType, 
          data.expiresIn
        );
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  },
  
  // Quên mật khẩu
  forgotPassword: async (email) => {
    return api.post('/api/auth/forgot-password', { email });
  },
  
  // Đặt lại mật khẩu
  resetPassword: async (token, password, confirmPassword) => {
    return api.post('/api/auth/reset-password', {
      token,
      password,
      confirmPassword
    });
  },
  
  // Đăng xuất
  logout: () => {
    // Gọi API đăng xuất nếu backend yêu cầu
    try {
      // api.post('/api/auth/logout'); // Uncomment nếu BE cần invalidate token
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Dù API có lỗi hay không, vẫn xóa dữ liệu local
      tokenUtils.clearTokens();
    }
  },
  
  // Lấy người dùng hiện tại từ localStorage
  getCurrentUser: () => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch (error) {
      localStorage.removeItem('user');
      return null;
    }
  },
  
  // Kiểm tra đã đăng nhập chưa
  isAuthenticated: () => {
    const token = tokenUtils.getAccessToken();
    
    if (!token) {
      return false;
    }
    
    // Kiểm tra token có hết hạn không
    if (tokenUtils.isAccessTokenExpired()) {
      // Token đã hết hạn, thử refresh
      authService.refreshToken().catch(() => {
        // Nếu refresh thất bại, đăng xuất
        authService.logout();
      });
      return false;
    }
    
    return true;
  },
  
  // Kiểm tra và quản lý token, trả về Promise
  checkAndRefreshToken: async () => {
    // Kiểm tra nếu không có token
    if (!tokenUtils.getAccessToken()) {
      return Promise.reject(new Error('Không có access token'));
    }
    
    // Nếu token chưa hết hạn, trả về Promise thành công
    if (!tokenUtils.isAccessTokenExpired()) {
      return Promise.resolve();
    }
    
    // Nếu token đã hết hạn, kiểm tra refresh token
    if (!tokenUtils.hasRefreshToken()) {
      return Promise.reject(new Error('Không có refresh token'));
    }
    
    // Thử refresh token
    return authService.refreshToken();
  },
  
  // Refresh token
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      return Promise.reject(new Error('Không có refresh token'));
    }
    
    try {
      const response = await axios.post(`${API_URL}/api/auth/refresh-token`, {
        refreshToken,
      });
      
      const data = response.data;
      
      // Cập nhật token mới
      tokenUtils.saveTokens(
        data.accessToken, 
        data.refreshToken, 
        data.tokenType, 
        data.expiresIn
      );
      
      return data;
    } catch (error) {
      // Token refresh thất bại
      authService.logout();
      return Promise.reject(error);
    }
  }
};

export default authService; 