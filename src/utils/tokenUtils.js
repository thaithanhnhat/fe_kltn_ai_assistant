/**
 * Utilities để kiểm tra và quản lý trạng thái token
 */

// Kiểm tra xem access token đã hết hạn chưa
export const isAccessTokenExpired = () => {
  const tokenExpiry = localStorage.getItem('tokenExpiry');
  
  if (!tokenExpiry) {
    return true;
  }
  
  // Trả về true nếu token đã hết hạn (thời gian hiện tại > thời gian hết hạn)
  return Date.now() > parseInt(tokenExpiry);
};

// Kiểm tra refresh token có tồn tại không
export const hasRefreshToken = () => {
  return !!localStorage.getItem('refreshToken');
};

// Lấy access token từ localStorage
export const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

// Lấy token type từ localStorage
export const getTokenType = () => {
  return localStorage.getItem('tokenType') || 'Bearer';
};

// Xóa tất cả thông tin token từ localStorage
export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tokenType');
  localStorage.removeItem('tokenExpiry');
  localStorage.removeItem('user');
};

// Lưu thông tin token mới vào localStorage
export const saveTokens = (accessToken, refreshToken, tokenType, expiresIn) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('tokenType', tokenType || 'Bearer');
  localStorage.setItem('tokenExpiry', Date.now() + (expiresIn || 3600) * 1000);
}; 