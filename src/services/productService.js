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
    if (error.message && (error.message.includes('token') || error.response?.status === 401)) {
      window.location.href = '/login'; // Chuyển hướng đến trang login
    }
    return Promise.reject(error);
  }
};

const productService = {
  // === Public Endpoints ===
  
  // Lấy tất cả sản phẩm (public)
  getAllProducts: async (page = 0, size = 10, keyword = '', category = '', sortBy = 'id', sortDir = 'asc') => {
    return api.get('/api/products', { 
      params: { page, size, keyword, category, sortBy, sortDir } 
    }).then(response => response.data);
  },
  
  // Lấy sản phẩm theo ID (public)
  getProductById: async (productId) => {
    return api.get(`/api/products/${productId}`).then(response => response.data);
  },
  
  // Lấy danh sách danh mục của một shop (public)
  getShopCategories: async (shopId) => {
    return api.get(`/api/shops/${shopId}/categories`).then(response => response.data);
  },
  
  // === Shop Owner Endpoints ===
  
  // Lấy danh sách sản phẩm của một shop
  getShopProducts: async (shopId, page = 0, size = 10, keyword = '', sortBy = 'id', sortDir = 'asc') => {
    return securedRequest(() => 
      api.get(`/api/shops/${shopId}/products`, { 
        params: { page, size, keyword, sortBy, sortDir } 
      }).then(response => response.data)
    );
  },
  
  // Lấy thông tin chi tiết sản phẩm trong một shop
  getShopProductById: async (shopId, productId) => {
    return securedRequest(() => 
      api.get(`/api/shops/${shopId}/products/${productId}`).then(response => response.data)
    );
  },
  
  // Tạo sản phẩm mới
  createProduct: async (shopId, productData) => {
    return securedRequest(() => 
      api.post(`/api/shops/${shopId}/products`, productData).then(response => response.data)
    );
  },
  
  // Cập nhật sản phẩm
  updateProduct: async (shopId, productId, productData) => {
    return securedRequest(() => 
      api.put(`/api/shops/${shopId}/products/${productId}`, productData).then(response => response.data)
    );
  },
  
  // Xóa sản phẩm (soft delete)
  deleteProduct: async (shopId, productId) => {
    return securedRequest(() => 
      api.delete(`/api/shops/${shopId}/products/${productId}`).then(response => response.status === 204)
    );
  },
  
  // Cập nhật số lượng tồn kho
  updateProductStock: async (shopId, productId, quantity) => {
    return securedRequest(() => 
      api.patch(`/api/shops/${shopId}/products/${productId}/stock?quantity=${quantity}`).then(response => response.status === 200)
    );
  },
  
  // Lấy dữ liệu sản phẩm cho AI consultation
  getProductsForConsultation: async (shopId) => {
    return securedRequest(() => 
      api.get(`/api/shops/${shopId}/products/consultation`).then(response => response.data)
    );
  },
  
  // Chuyển đổi file thành Base64
  fileToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  }
};

export default productService; 