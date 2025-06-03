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
  timeout: 20000, // Timeout 20 giây vì tạo ảnh có thể mất từ 5-20 giây
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
    if (error.message && (error.message.includes('token') || error.response?.status === 401)) {
      window.location.href = '/login'; // Chuyển hướng đến trang login
    }
    return Promise.reject(error);
  }
};

// Hàm để lấy image data từ URL
const getImageBase64FromUrl = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image URL to base64:', error);
    return null;
  }
};

const imageGenerationService = {
  // Tạo hình ảnh sản phẩm mới bằng AI
  generateProductImage: async (productId, prompt, fileName = null, modelId = null) => {
    const requestData = {
      productId,
      prompt
    };
    
    if (fileName) {
      requestData.fileName = fileName;
    }
    
    if (modelId) {
      requestData.modelId = modelId;
    }
    
    return securedRequest(async () => {
      try {
        const response = await api.post('/api/products/image-generation', requestData);
        return response.data;
      } catch (error) {
        // Xử lý các mã lỗi cụ thể
        if (error.response) {
          const { status, data } = error.response;
          
          switch (status) {
            case 400:
              throw new Error(data.message || 'Tham số đầu vào không hợp lệ');
            case 401:
              throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
            case 403:
              throw new Error('Bạn không có quyền chỉnh sửa sản phẩm này');
            case 404:
              throw new Error('Không tìm thấy sản phẩm');
            case 429:
              throw new Error('Bạn đã vượt quá giới hạn số lần gọi API');
            default:
              throw new Error(data.message || 'Đã xảy ra lỗi khi tạo hình ảnh');
          }
        }
        
        throw error;
      }
    });
  }
};

export default imageGenerationService; 