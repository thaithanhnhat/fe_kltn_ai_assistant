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

const feedbackService = {
  // Create a new feedback
  createFeedback: async (feedbackData) => {
    return securedRequest(() => 
      api.post('/api/feedbacks', feedbackData).then(response => response.data)
    );
  },
  
  // Get feedback by ID
  getFeedback: async (feedbackId) => {
    return securedRequest(() => 
      api.get(`/api/feedbacks/${feedbackId}`).then(response => response.data)
    );
  },
  
  // Get all feedbacks for a shop
  getFeedbacksByShopId: async (shopId) => {
    return securedRequest(() => 
      api.get(`/api/feedbacks/shop/${shopId}`).then(response => response.data)
    );
  },
  
  // Get feedbacks by customer ID
  getFeedbacksByCustomerId: async (customerId) => {
    return securedRequest(() => 
      api.get(`/api/feedbacks/customer/${customerId}`).then(response => response.data)
    );
  },
  
  // Get feedbacks by product ID
  getFeedbacksByProductId: async (productId) => {
    return securedRequest(() => 
      api.get(`/api/feedbacks/product/${productId}`).then(response => response.data)
    );
  },
  
  // Delete feedback
  deleteFeedback: async (feedbackId) => {
    return securedRequest(() => 
      api.delete(`/api/feedbacks/${feedbackId}`).then(response => response.status === 204)
    );
  }
};

export default feedbackService; 