import axios from 'axios';

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
    const token = localStorage.getItem('accessToken');
    const tokenType = localStorage.getItem('tokenType') || 'Bearer';
    
    if (token) {
      config.headers.Authorization = `${tokenType} ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const web3Service = {
  // Tạo địa chỉ nạp tiền mới
  createDepositAddress: async (purpose) => {
    try {
      const response = await api.post('/api/web3/deposit-address', { purpose });
      return response.data;
    } catch (error) {
      console.error('Error creating deposit address:', error);
      throw error;
    }
  },
  
  // Tạo ví Web3 mới
  createWallet: async () => {
    try {
      const response = await api.post('/api/web3/wallets');
      return response.data;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  },
  
  // Lấy danh sách ví Web3
  getWallets: async () => {
    try {
      const response = await api.get('/api/web3/wallets');
      return response.data;
    } catch (error) {
      console.error('Error fetching wallets:', error);
      throw error;
    }
  },
  
  // Lấy thông tin ví theo địa chỉ
  getWalletByAddress: async (address) => {
    try {
      const response = await api.get(`/api/web3/wallets/${address}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet details:', error);
      throw error;
    }
  },
  
  // Lấy số dư ví
  getWalletBalance: async (address) => {
    try {
      const response = await api.get(`/api/web3/wallets/${address}/balance`);
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      throw error;
    }
  }
};

export default web3Service; 