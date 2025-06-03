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

const customerService = {
  // Create a new customer
  createCustomer: async (shopId, customerData) => {
    return securedRequest(() => 
      api.post('/api/customers', {
        shopId,
        ...customerData
      }).then(response => response.data)
    );
  },
  
  // Get customer by ID
  getCustomer: async (customerId) => {
    return securedRequest(() => 
      api.get(`/api/customers/${customerId}`).then(response => response.data)
    );
  },
  
  // Get all customers for a shop
  getCustomersByShopId: async (shopId) => {
    return securedRequest(() => 
      api.get(`/api/customers/shop/${shopId}`).then(response => response.data)
    );
  },
  
  // Update customer
  updateCustomer: async (shopId, customerId, customerData) => {
    return securedRequest(() => 
      api.put(`/api/customers/${customerId}`, {
        shopId,
        ...customerData
      }).then(response => response.data)
    );
  },
  
  // Delete customer
  deleteCustomer: async (customerId) => {
    return securedRequest(() => 
      api.delete(`/api/customers/${customerId}`).then(response => response.status === 204)
    );
  }
};

export default customerService; 