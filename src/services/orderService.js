import axios from 'axios';
import * as tokenUtils from '../utils/tokenUtils';
import authService from './authService';

const API_URL = 'http://localhost:8080/assistant';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Timeout after 10 seconds
});

// Add interceptor to handle token in headers
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

// Function to ensure request is made with valid token
const securedRequest = async (requestFn) => {
  try {
    // Check and refresh token if needed
    await authService.checkAndRefreshToken();
    return requestFn();
  } catch (error) {
    // If token is invalid and cannot be refreshed
    if (error.message.includes('token') || error.response?.status === 401) {
      window.location.href = '/login'; // Redirect to login page
    }
    return Promise.reject(error);
  }
};

const orderService = {
  // Create a new order
  createOrder: async (orderData) => {
    return securedRequest(() => 
      api.post('/api/orders', orderData).then(response => response.data)
    );
  },
  
  // Get order by ID
  getOrder: async (orderId) => {
    return securedRequest(() => 
      api.get(`/api/orders/${orderId}`).then(response => response.data)
    );
  },
  
  // Get all orders for a shop
  getOrdersByShopId: async (shopId) => {
    return securedRequest(() => 
      api.get(`/api/orders/shop/${shopId}`).then(response => response.data)
    );
  },
  
  // Get orders by customer ID
  getOrdersByCustomerId: async (customerId) => {
    return securedRequest(() => 
      api.get(`/api/orders/customer/${customerId}`).then(response => response.data)
    );
  },
  
  // Get orders by status
  getOrdersByStatus: async (shopId, status) => {
    return securedRequest(() => 
      api.get(`/api/orders/shop/${shopId}/status/${status}`).then(response => response.data)
    );
  },
  
  // Get orders by date range
  getOrdersByDateRange: async (shopId, startDate, endDate) => {
    return securedRequest(() => 
      api.get(`/api/orders/shop/${shopId}/date-range`, {
        params: { startDate, endDate }
      }).then(response => response.data)
    );
  },
  
  // Update order status
  updateOrderStatus: async (orderId, statusData) => {
    return securedRequest(() => 
      api.patch(`/api/orders/${orderId}/status`, statusData).then(response => response.data)
    );
  },
  
  // Delete order
  deleteOrder: async (orderId) => {
    return securedRequest(() => 
      api.delete(`/api/orders/${orderId}`).then(response => response.status === 204)
    );
  }
};

export default orderService; 