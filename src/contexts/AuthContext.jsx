import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  
  useEffect(() => {
    // Kiểm tra nếu có người dùng đã đăng nhập
    const checkAuthStatus = async () => {
      try {
        if (authService.isAuthenticated()) {
          const user = authService.getCurrentUser();
          if (user) {
            setCurrentUser(user);
          } else {
            // Có token nhưng không có thông tin user, thử refresh token
            try {
              await authService.refreshToken();
              setCurrentUser(authService.getCurrentUser());
            } catch (refreshError) {
              // Nếu refresh thất bại, đăng xuất
              authService.logout();
            }
          }
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Đăng nhập
  const login = async (email, password) => {
    try {
      setAuthError(null);
      const data = await authService.login({ email, password });
      setCurrentUser(data.user);
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      const errorCode = error.response?.data?.error || 'unknown_error';
      
      setAuthError({
        code: errorCode,
        message: errorMessage
      });
      
      throw error;
    }
  };
  
  // Đăng xuất
  const logout = () => {
    try {
      authService.logout();
      setCurrentUser(null);
      setAuthError(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  
  // Đăng ký
  const register = async (userData) => {
    try {
      setAuthError(null);
      const response = await authService.register(userData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      const errorCode = error.response?.data?.error || 'unknown_error';
      
      setAuthError({
        code: errorCode,
        message: errorMessage
      });
      
      throw error;
    }
  };
  
  // Gửi lại email xác minh
  const resendVerification = async (email) => {
    try {
      setAuthError(null);
      const response = await authService.resendVerification(email);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      const errorCode = error.response?.data?.error || 'unknown_error';
      
      setAuthError({
        code: errorCode,
        message: errorMessage
      });
      
      throw error;
    }
  };
  
  // Kiểm tra tính hợp lệ của token
  const checkToken = async (token) => {
    try {
      setAuthError(null);
      const response = await authService.checkToken(token);
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      const errorCode = error.response?.data?.error || 'unknown_error';
      
      setAuthError({
        code: errorCode,
        message: errorMessage
      });
      
      throw error;
    }
  };
  
  // Xác thực email bằng token
  const verifyToken = async (token) => {
    try {
      setAuthError(null);
      const response = await authService.verifyToken(token);
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      const errorCode = error.response?.data?.error || 'unknown_error';
      
      setAuthError({
        code: errorCode,
        message: errorMessage
      });
      
      throw error;
    }
  };
  
  // Kiểm tra tính hợp lệ của token đặt lại mật khẩu
  const validatePasswordResetToken = async (token) => {
    try {
      setAuthError(null);
      const response = await authService.validatePasswordResetToken(token);
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      const errorCode = error.response?.data?.error || 'unknown_error';
      
      setAuthError({
        code: errorCode,
        message: errorMessage
      });
      
      throw error;
    }
  };
  
  // Quên mật khẩu
  const forgotPassword = async (email) => {
    try {
      setAuthError(null);
      const response = await authService.forgotPassword(email);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      const errorCode = error.response?.data?.error || 'unknown_error';
      
      setAuthError({
        code: errorCode,
        message: errorMessage
      });
      
      throw error;
    }
  };
  
  // Đặt lại mật khẩu
  const resetPassword = async (token, password, confirmPassword) => {
    try {
      setAuthError(null);
      const response = await authService.resetPassword(token, password, confirmPassword);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      const errorCode = error.response?.data?.error || 'unknown_error';
      
      setAuthError({
        code: errorCode,
        message: errorMessage
      });
      
      throw error;
    }
  };
  
  // Hàm refresh token có thể được gọi từ bên ngoài
  const refreshUserToken = async () => {
    try {
      setAuthError(null);
      const data = await authService.refreshToken();
      
      // Cập nhật user state nếu có thông tin mới
      if (data.user) {
        setCurrentUser(data.user);
      }
      
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      const errorCode = error.response?.data?.error || 'unknown_error';
      
      setAuthError({
        code: errorCode,
        message: errorMessage
      });
      
      throw error;
    }
  };
  
  const value = {
    currentUser,
    login,
    logout,
    register,
    resendVerification,
    checkToken,
    verifyToken,
    validatePasswordResetToken,
    forgotPassword,
    resetPassword,
    refreshToken: refreshUserToken,
    isAuthenticated: authService.isAuthenticated,
    authError
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 