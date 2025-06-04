import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiArrowLeft, FiShoppingBag,
  FiPlus, FiTrash2, FiEye, FiEyeOff, FiRefreshCw, 
  FiAlertCircle, FiCheckCircle, FiX, FiCopy, FiInfo,
  FiSettings, FiPlay, FiPause, FiMessageSquare, FiHelpCircle
} from 'react-icons/fi';
import { FaFacebookSquare, FaTelegram } from 'react-icons/fa';
import shopService from '../services/shopService';
import integrationTokenService from '../services/integrationTokenService';
import '../assets/css/shop-tokens.css';

const ShopTokens = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  
  const [shop, setShop] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    accessToken: '',
    pageId: '',
    method: 'FACEBOOK'
  });  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  
  // Collapsible instructions state
  const [showTelegramInstructions, setShowTelegramInstructions] = useState(false);
  const [showFacebookInstructions, setShowFacebookInstructions] = useState(false);
  
  // Facebook bot state
  const [facebookBotStatus, setFacebookBotStatus] = useState(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [webhookInfo, setWebhookInfo] = useState(null);
  const [showWebhookInfo, setShowWebhookInfo] = useState(false);
  const [setupStep, setSetupStep] = useState(0); // 0: Not started, 1: Webhook configured, 2: Token saved, 3: Bot started

  // Lấy thông tin shop
  const fetchShopDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const shopData = await shopService.getShopById(shopId);
      setShop(shopData);
    } catch (err) {
      console.error('Error fetching shop details:', err);
      setError('Không thể tải thông tin cửa hàng. Vui lòng thử lại sau.');
      if (err.message && (err.message.includes('token') || err.response?.status === 401)) {
        logout();
        navigate('/login');
        return;
      }
    } finally {
      setIsLoading(false);
    }
  }, [shopId, logout, navigate]);

  // Lấy danh sách token của shop
  const fetchTokens = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const tokensData = await integrationTokenService.getTokensByShopId(shopId);
      setTokens(tokensData);
    } catch (err) {
      console.error('Error fetching tokens:', err);
      setError('Không thể tải danh sách token. Vui lòng thử lại sau.');
      if (err.message && (err.message.includes('token') || err.response?.status === 401)) {
        logout();
        navigate('/login');
        return;
      }
    } finally {
      setIsLoading(false);
    }
  }, [shopId, logout, navigate]);
  
  // Kiểm tra trạng thái Facebook bot - Chỉ gọi sau khi đã cấu hình đầy đủ
  const checkFacebookBotStatus = useCallback(async () => {
    try {
      // Chỉ kiểm tra khi đã đến bước 3
      if (setupStep < 3) {
        return; 
      }
      
      const statusData = await integrationTokenService.checkFacebookBotStatus(shopId);
      setFacebookBotStatus(statusData);
    } catch (err) {
      console.error('Error checking Facebook bot status:', err);
      // Nếu lỗi liên quan đến chưa cấu hình, đặt setupStep về 0
      if (err.response?.data?.message?.includes('configuration not found')) {
        setSetupStep(0);
      }
    }
  }, [shopId, setupStep]);

  // Thêm token mới
  const addToken = async (e) => {
    e.preventDefault();
    if (!formData.accessToken.trim()) {
      setError('Vui lòng nhập access token');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await integrationTokenService.addToken(formData.accessToken, formData.method, shopId);
      setSuccess(`Đã thêm token ${formData.method} thành công!`);
      setFormData({
        accessToken: '',
        pageId: '',
        method: 'FACEBOOK'
      });
      setIsFormVisible(false);
      fetchTokens(); // Refresh token list
    } catch (err) {
      console.error('Error adding token:', err);
      setError('Không thể thêm token. Vui lòng thử lại sau.');
      if (err.message && (err.message.includes('token') || err.response?.status === 401)) {
        logout();
        navigate('/login');
        return;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Thay đổi trạng thái token
  const updateTokenStatus = async (tokenId, newStatus) => {
    try {
      setIsLoading(true);
      setError(null);
      await integrationTokenService.updateTokenStatus(tokenId, newStatus);
      setSuccess(`Đã cập nhật trạng thái token thành công!`);
      fetchTokens(); // Refresh token list
    } catch (err) {
      console.error('Error updating token status:', err);
      setError('Không thể cập nhật trạng thái token. Vui lòng thử lại sau.');
      if (err.message && (err.message.includes('token') || err.response?.status === 401)) {
        logout();
        navigate('/login');
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Xóa token
  const deleteToken = async (tokenId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa token này?')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await integrationTokenService.deleteToken(tokenId);
      setSuccess('Đã xóa token thành công!');
      fetchTokens(); // Refresh token list
    } catch (err) {
      console.error('Error deleting token:', err);
      setError('Không thể xóa token. Vui lòng thử lại sau.');
      if (err.message && (err.message.includes('token') || err.response?.status === 401)) {
        logout();
        navigate('/login');
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Bước 1: Cấu hình Facebook webhook
  const configureFacebookWebhook = async () => {
    try {
      setIsConfiguring(true);
      setError(null);
      const webhookData = await integrationTokenService.configureFacebookWebhook(shopId);
      setWebhookInfo(webhookData);
      setShowWebhookInfo(true);
      setSetupStep(1); // Đánh dấu bước 1 hoàn thành
      setSuccess('Đã cấu hình webhook thành công! Tiếp theo hãy lưu Facebook Page Access Token.');
    } catch (err) {
      console.error('Error configuring webhook:', err);
      setError('Không thể cấu hình webhook. Vui lòng thử lại sau.');
      if (err.message && (err.message.includes('token') || err.response?.status === 401)) {
        logout();
        navigate('/login');
        return;
      }
    } finally {
      setIsConfiguring(false);
    }
  };
  
  // Bước 2: Lưu Facebook access token
  const saveFacebookToken = async () => {
    if (setupStep < 1) {
      setError('Vui lòng cấu hình webhook trước khi lưu token!');
      return;
    }
    
    if (!formData.accessToken.trim()) {
      setError('Vui lòng nhập Facebook Page Access Token');
      return;
    }
    
    if (!formData.pageId.trim()) {
      setError('Vui lòng nhập Facebook Page ID');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      await integrationTokenService.saveFacebookAccessToken(shopId, formData.accessToken, formData.pageId);
      setSetupStep(2); // Đánh dấu bước 2 hoàn thành
      setSuccess('Đã lưu Facebook access token thành công! Tiếp theo hãy bắt đầu bot.');
      setFormData({
        ...formData,
        accessToken: '', // Xóa token sau khi lưu thành công
        pageId: '' // Xóa Page ID sau khi lưu thành công
      });
    } catch (err) {
      console.error('Error saving Facebook token:', err);
      
      // Xử lý lỗi cụ thể
      if (err.response?.data?.message?.includes('configuration not found')) {
        setError('Không tìm thấy cấu hình Facebook. Vui lòng cấu hình webhook trước!');
        setSetupStep(0);
      } else if (err.message && err.message.includes('Page ID')) {
        setError(err.message);
      } else {
        setError('Không thể lưu Facebook token. Vui lòng thử lại sau.');
      }
      
      if (err.message && (err.message.includes('token') || err.response?.status === 401)) {
        logout();
        navigate('/login');
        return;
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Bước 3: Bắt đầu Facebook bot
  const startFacebookBot = async () => {
    if (setupStep < 2) {
      setError('Vui lòng cấu hình webhook và lưu token trước khi bắt đầu bot!');
      return;
    }
    
    try {
      setIsConfiguring(true);
      setError(null);
      await integrationTokenService.startFacebookBot(shopId);
      setSetupStep(3); // Đánh dấu bước 3 hoàn thành
      setSuccess('Đã bắt đầu Facebook bot thành công!');
      
      // Sau khi bot đã được bắt đầu, mới kiểm tra trạng thái
      setTimeout(() => checkFacebookBotStatus(), 1000);
    } catch (err) {
      console.error('Error starting Facebook bot:', err);
      
      // Xử lý lỗi cụ thể
      if (err.response?.data?.message?.includes('configuration not found')) {
        setError('Không tìm thấy cấu hình Facebook. Vui lòng cấu hình webhook và lưu token trước!');
        setSetupStep(0);
      } else if (err.response?.data?.message?.includes('access token')) {
        setError('Access token không hợp lệ hoặc chưa được lưu. Vui lòng kiểm tra lại!');
        setSetupStep(1);
      } else {
        setError('Không thể bắt đầu Facebook bot. Vui lòng thử lại sau.');
      }
      
      if (err.message && (err.message.includes('token') || err.response?.status === 401)) {
        logout();
        navigate('/login');
        return;
      }
    } finally {
      setIsConfiguring(false);
    }
  };
  
  // Dừng Facebook bot
  const stopFacebookBot = async () => {
    if (setupStep < 3) {
      setError('Facebook bot chưa được bắt đầu!');
      return;
    }
    
    try {
      setIsConfiguring(true);
      setError(null);
      await integrationTokenService.stopFacebookBot(shopId);
      setSuccess('Đã dừng Facebook bot thành công!');
      
      // Cập nhật trạng thái sau khi dừng
      setTimeout(() => checkFacebookBotStatus(), 1000);
    } catch (err) {
      console.error('Error stopping Facebook bot:', err);
      
      // Xử lý lỗi cụ thể
      if (err.response?.data?.message?.includes('configuration not found')) {
        setError('Không tìm thấy cấu hình Facebook. Vui lòng cấu hình lại!');
        setSetupStep(0);
      } else {
        setError('Không thể dừng Facebook bot. Vui lòng thử lại sau.');
      }
      
      if (err.message && (err.message.includes('token') || err.response?.status === 401)) {
        logout();
        navigate('/login');
        return;
      }
    } finally {
      setIsConfiguring(false);
    }
  };

  // Form handlers
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Load data khi component được mount
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    fetchShopDetails();
    fetchTokens();
    
    // KHÔNG gọi checkFacebookBotStatus khi khởi tạo
    // Chỉ kiểm tra trạng thái sau khi đã cấu hình đầy đủ
  }, [fetchShopDetails, fetchTokens, isAuthenticated, navigate]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Render token status badge
  const renderStatusBadge = (status) => {
    let className = '';
    let label = '';

    switch (status) {
      case 'ACTIVE':
        className = 'status-active';
        label = 'Hoạt động';
        break;
      case 'EXPIRED':
        className = 'status-expired';
        label = 'Hết hạn';
        break;
      case 'REVOKED':
        className = 'status-revoked';
        label = 'Đã thu hồi';
        break;
      default:
        className = 'status-unknown';
        label = 'Không xác định';
    }

    return <span className={`status-badge ${className}`}>{label}</span>;
  };

  // Render platform icon
  const renderPlatformIcon = (method) => {
    switch (method) {
      case 'FACEBOOK':
        return <FaFacebookSquare className="platform-icon facebook" />;
      case 'TELEGRAM':
        return <FaTelegram className="platform-icon telegram" />;
      default:
        return <FiInfo className="platform-icon" />;
    }
  };

  // Format token for display (hide part of it)
  const formatToken = (token) => {
    if (!token) return '';
    if (showToken) return token;
    if (token.length <= 8) return '••••••••';
    return token.substring(0, 4) + '••••••••' + token.substring(token.length - 4);
  };

  // Render step indicator
  const renderStepIndicator = (step, currentStep) => {
    return (
      <div className={`setup-step-indicator ${currentStep >= step ? 'completed' : ''}`}>
        <div className="step-number">{step}</div>
        <div className="step-text">
          {step === 1 && 'Cấu hình Webhook'}
          {step === 2 && 'Lưu Facebook Token'}
          {step === 3 && 'Khởi động Bot'}
          {step === 4 && 'Kiểm tra trạng thái'}
        </div>
      </div>
    );
  };

  return (
    <div className="shop-tokens-container">
      <div className="tokens-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          <FiArrowLeft /> Quay lại Dashboard
        </button>
        <h1>
          <FiShoppingBag className="shop-icon" /> 
          {isLoading ? 'Đang tải...' : (shop ? shop.name : 'Cửa hàng')}
        </h1>
      </div>

      {error && (
        <div className="error-alert">
          <FiAlertCircle className="alert-icon" />
          <span>{error}</span>
          <button className="close-alert" onClick={() => setError(null)}>
            <FiX />
          </button>
        </div>
      )}

      {success && (
        <div className="success-alert">
          <FiCheckCircle className="alert-icon" />
          <span>{success}</span>
          <button className="close-alert" onClick={() => setSuccess(null)}>
            <FiX />
          </button>
        </div>
      )}
      
      {/* Facebook Bot Configuration Section */}
      <div className="tokens-section">
        <div className="section-header">
          <h2><FaFacebookSquare /> Facebook Messenger Bot Configuration</h2>
        </div>
        
        {/* Thêm hướng dẫn cấu hình theo thứ tự */}
        <div className="setup-guide-box">
          <div className="guide-header">
            <FiHelpCircle /> Hướng dẫn cấu hình Facebook Bot
          </div>
          <div className="guide-content">
            <p>Để tránh lỗi, vui lòng tuân thủ đúng thứ tự cấu hình sau:</p>
            <div className="setup-steps-container">
              {renderStepIndicator(1, setupStep)}
              {renderStepIndicator(2, setupStep)}
              {renderStepIndicator(3, setupStep)}
              {renderStepIndicator(4, setupStep)}
            </div>
            <div className="guide-note">
              <FiAlertCircle /> Nếu bạn gặp lỗi "Facebook configuration not found", hãy thực hiện lại từ bước 1.
            </div>
            <div className="guide-note">
              <FiAlertCircle /> Phải nhập cả Page ID khi lưu token để tránh lỗi database.
            </div>
          </div>
        </div>
        
        <div className="facebook-config-panel">
          <div className="facebook-status-card">
            <h3>Bot Status</h3>
            <div className="status-display">
              {facebookBotStatus ? (
                <>
                  <div className={`status-indicator ${facebookBotStatus.active ? 'active' : 'inactive'}`}></div>
                  <span>{facebookBotStatus.active ? 'Active' : 'Inactive'}</span>
                </>
              ) : (
                <span>Not configured</span>
              )}
            </div>
            
            <div className="facebook-actions">
              <button 
                className="facebook-action-btn configure-btn" 
                onClick={configureFacebookWebhook}
                disabled={isConfiguring}
              >
                <FiSettings /> 1. Configure Webhook
              </button>
              
              {(setupStep >= 1) && (
                <button 
                  className={`facebook-action-btn ${facebookBotStatus && facebookBotStatus.active ? 'stop-btn' : 'start-btn'}`}
                  onClick={facebookBotStatus && facebookBotStatus.active ? stopFacebookBot : startFacebookBot}
                  disabled={isConfiguring || setupStep < 2}
                >
                  {facebookBotStatus && facebookBotStatus.active ? (
                    <>
                      <FiPause /> 4. Stop Bot
                    </>
                  ) : (
                    <>
                      <FiPlay /> 3. Start Bot
                    </>
                  )}
                </button>
              )}
              
              {(setupStep >= 3) && (
                <button 
                  className="facebook-action-btn check-btn" 
                  onClick={checkFacebookBotStatus}
                  disabled={isConfiguring}
                >
                  <FiRefreshCw /> 4. Check Status
                </button>
              )}
            </div>
          </div>
          
          {/* Webhook Info Display */}
          {showWebhookInfo && webhookInfo && (
            <div className="webhook-info-card">
              <h3>Webhook Configuration</h3>
              <div className="webhook-info-item">
                <span className="webhook-label">Webhook URL:</span>
                <div className="webhook-value">
                  <code>{webhookInfo.webhookUrl}</code>
                  <button
                    className="copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(webhookInfo.webhookUrl);
                      setSuccess('Đã sao chép webhook URL!');
                    }}
                  >
                    <FiCopy />
                  </button>
                </div>
              </div>
              
              <div className="webhook-info-item">
                <span className="webhook-label">Verify Token:</span>
                <div className="webhook-value">
                  <code>{webhookInfo.verifyToken}</code>
                  <button
                    className="copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(webhookInfo.verifyToken);
                      setSuccess('Đã sao chép verify token!');
                    }}
                  >
                    <FiCopy />
                  </button>
                </div>
              </div>
              
              <div className="webhook-info-box">
                <ol className="setup-steps">
                  <li>Go to <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer">Facebook Developer Portal</a></li>
                  <li>Create a new app or use an existing one</li>
                  <li>Add Messenger product to your app</li>
                  <li>Under Messenger Settings, go to "Webhooks" section</li>
                  <li>Click "Add Callback URL"</li>
                  <li>Enter the Webhook URL and Verify Token</li>
                  <li>Subscribe to events: <code>messages</code>, <code>messaging_postbacks</code></li>
                  <li>Get a Page Access Token from the "Access Tokens" section</li>
                  <li>Note your Page ID (displayed next to your page name)</li>
                </ol>
              </div>
              
              <div className="token-input-form">
                <h4>2. Save Page Access Token</h4>
                <div className="token-input-container">
                  <input
                    type={showToken ? "text" : "password"}
                    placeholder="Enter Facebook Page Access Token"
                    value={formData.accessToken}
                    onChange={(e) => setFormData({...formData, accessToken: e.target.value})}
                    disabled={setupStep < 1}
                  />
                  <button 
                    type="button" 
                    className="toggle-view-btn"
                    onClick={() => setShowToken(prev => !prev)}
                  >
                    {showToken ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                
                <div className="token-input-container mt-3">
                  <input
                    type="text"
                    placeholder="Enter Facebook Page ID"
                    value={formData.pageId}
                    onChange={(e) => setFormData({...formData, pageId: e.target.value})}
                    disabled={setupStep < 1}
                  />
                </div>
                
                <div className="pageid-info-box">
                  <FiInfo className="info-icon" />
                  <div>
                    <strong>Cách lấy Page ID:</strong>
                    <ul className="pageid-help-list">
                      <li>Từ URL của trang: <code>facebook.com/[trang-cua-ban-hoặc-ID]</code></li>
                      <li>Từ Facebook Developer Portal: Trong phần "Messenger Settings" &gt; "Access Tokens"</li>
                      <li>Từ thông tin trang: Vào mục "About" hoặc "Thông tin" của trang</li>
                    </ul>
                  </div>
                </div>
                
                <button 
                  className="save-token-btn"
                  onClick={saveFacebookToken}
                  disabled={isSubmitting || !formData.accessToken || !formData.pageId || setupStep < 1}
                >
                  {isSubmitting ? (
                    <>
                      <FiRefreshCw className="spinning" /> Saving...
                    </>
                  ) : (
                    'Save Token and Page ID'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="tokens-section">
        <div className="section-header">
          <h2>Integration Tokens</h2>
          <button className="add-token-btn" onClick={() => setIsFormVisible(true)}>
            <FiPlus /> Thêm Token
          </button>
        </div>

        {isFormVisible && (
          <div className="token-form-container">
            <form onSubmit={addToken} className="token-form">
              <h3>Thêm Integration Token</h3>
              <div className="form-group">
                <label htmlFor="method">Nền tảng</label>
                <select
                  id="method"
                  name="method"
                  value={formData.method}
                  onChange={handleFormChange}
                  required
                >
                  <option value="FACEBOOK">Facebook</option>
                  <option value="TELEGRAM">Telegram</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="accessToken">Access Token</label>
                <div className="token-input-container">
                  <input
                    type={showToken ? "text" : "password"}
                    id="accessToken"
                    name="accessToken"
                    value={formData.accessToken}
                    onChange={handleFormChange}
                    placeholder={`Nhập ${formData.method.toLowerCase()} access token`}
                    required
                  />                  <button 
                    type="button" 
                    className="toggle-view-btn"
                    onClick={() => setShowToken(prev => !prev)}
                  >
                    {showToken ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              
              {formData.method === 'FACEBOOK' ? (
                <div className="facebook-instructions">
                  <div 
                    className="instruction-header clickable"
                    onClick={() => setShowFacebookInstructions(!showFacebookInstructions)}
                  >
                    <FiInfo className="info-icon" />
                    <span>Hướng dẫn lấy Facebook Page Access Token</span>
                    <FiHelpCircle className={`toggle-icon ${showFacebookInstructions ? 'expanded' : ''}`} />
                  </div>
                  {showFacebookInstructions && (
                    <div className="instruction-steps">
                      <div className="step">
                        <span className="step-number">1</span>
                        <div className="step-content">
                          <strong>Truy cập Facebook Developers</strong>
                          <p>Vào <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer">developers.facebook.com</a> và đăng nhập tài khoản Facebook của bạn</p>
                        </div>
                      </div>
                      <div className="step">
                        <span className="step-number">2</span>
                        <div className="step-content">
                          <strong>Tạo ứng dụng mới</strong>
                          <p>Nhấn "Create App" và chọn loại "Business" hoặc "Consumer"</p>
                        </div>
                      </div>
                      <div className="step">
                        <span className="step-number">3</span>
                        <div className="step-content">
                          <strong>Thêm Facebook Login</strong>
                          <p>Trong dashboard ứng dụng, thêm sản phẩm "Facebook Login"</p>
                        </div>
                      </div>
                      <div className="step">
                        <span className="step-number">4</span>
                        <div className="step-content">
                          <strong>Lấy Page Access Token</strong>
                          <p>Vào Tools &gt; Graph API Explorer, chọn Page của bạn và copy Access Token</p>
                          <p className="warning-text">⚠️ Đảm bảo token có quyền manage_pages và pages_messaging!</p>
                        </div>
                      </div>
                      <div className="step">
                        <span className="step-number">5</span>
                        <div className="step-content">
                          <strong>Lấy Page ID</strong>
                          <p>Vào Page Settings &gt; About &gt; Page ID hoặc xem trong Graph API Explorer</p>
                        </div>
                      </div>
                    </div>                  )}
                </div>
              ) : (
                <div className="telegram-instructions">
                  <div 
                    className="instruction-header clickable"
                    onClick={() => setShowTelegramInstructions(!showTelegramInstructions)}
                  >
                    <FiInfo className="info-icon" />
                    <span>Hướng dẫn lấy Telegram Bot Token từ BotFather</span>
                    <FiHelpCircle className={`toggle-icon ${showTelegramInstructions ? 'expanded' : ''}`} />
                  </div>
                  {showTelegramInstructions && (
                    <div className="instruction-steps">
                    <div className="step">
                      <span className="step-number">1</span>
                      <div className="step-content">
                        <strong>Mở Telegram và tìm BotFather</strong>
                        <p>Tìm kiếm <code>@BotFather</code> trong Telegram hoặc nhấn vào link: <a href="https://t.me/botfather" target="_blank" rel="noopener noreferrer">t.me/botfather</a></p>
                      </div>
                    </div>
                    <div className="step">
                      <span className="step-number">2</span>
                      <div className="step-content">
                        <strong>Tạo bot mới</strong>
                        <p>Gửi lệnh <code>/newbot</code> cho BotFather</p>
                      </div>
                    </div>
                    <div className="step">
                      <span className="step-number">3</span>
                      <div className="step-content">
                        <strong>Đặt tên cho bot</strong>
                        <p>Nhập tên hiển thị cho bot của bạn (ví dụ: "My Shop Bot")</p>
                      </div>
                    </div>
                    <div className="step">
                      <span className="step-number">4</span>
                      <div className="step-content">
                        <strong>Đặt username cho bot</strong>
                        <p>Nhập username cho bot (phải kết thúc bằng "bot", ví dụ: "myshop_bot")</p>
                      </div>
                    </div>
                    <div className="step">
                      <span className="step-number">5</span>
                      <div className="step-content">
                        <strong>Lấy token</strong>
                        <p>BotFather sẽ gửi cho bạn một token có dạng: <code>123456789:ABCdefGHIjklMNOpqrsTUVwxyz</code></p>
                        <p className="warning-text">⚠️ Giữ token này bí mật và không chia sẻ với ai!</p>
                      </div>
                    </div>                    <div className="step">
                      <span className="step-number">6</span>
                      <div className="step-content">
                        <strong>Sao chép và dán token</strong>
                        <p>Sao chép token từ BotFather và dán vào ô "Access Token" bên trên</p>
                      </div>
                    </div>
                    </div>
                  )}
                </div>
              )}
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setIsFormVisible(false);
                    setFormData({
                      accessToken: '',
                      pageId: '',
                      method: 'FACEBOOK'
                    });
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <FiRefreshCw className="spinning" /> Đang xử lý...
                    </>
                  ) : (
                    'Thêm Token'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Đang tải danh sách token...</p>
          </div>
        ) : tokens.length === 0 ? (
          <div className="empty-tokens">
            <p>Chưa có token nào được thêm cho cửa hàng này</p>
            <button className="add-first-token" onClick={() => setIsFormVisible(true)}>
              <FiPlus /> Thêm token đầu tiên
            </button>
          </div>
        ) : (
          <div className="tokens-list">
            {tokens.map(token => (
              <div key={token.id} className="token-card">
                <div className="token-header">
                  {renderPlatformIcon(token.method)}
                  <h3>{token.method}</h3>
                  {renderStatusBadge(token.status)}
                </div>
                <div className="token-content">
                  <div className="token-value">
                    <span className="token-label">Access Token:</span>
                    <div className="token-display">
                      <code>{formatToken(token.accessToken)}</code>
                      <button
                        className="copy-token-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(token.accessToken);
                          setSuccess('Đã sao chép token!');
                        }}
                      >
                        <FiCopy />
                      </button>
                    </div>
                  </div>
                  <div className="token-info">
                    <span className="token-label">ID:</span>
                    <code>{token.id}</code>
                  </div>
                  {token.createdAt && (
                    <div className="token-info">
                      <span className="token-label">Ngày tạo:</span>
                      <span>{new Date(token.createdAt).toLocaleString()}</span>
                    </div>
                  )}
                  {token.updatedAt && (
                    <div className="token-info">
                      <span className="token-label">Cập nhật lần cuối:</span>
                      <span>{new Date(token.updatedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="token-actions">
                  {token.status === 'ACTIVE' ? (
                    <button 
                      className="token-action-btn revoke-btn"
                      onClick={() => updateTokenStatus(token.id, 'REVOKED')}
                    >
                      Thu hồi Token
                    </button>
                  ) : token.status === 'REVOKED' ? (
                    <button 
                      className="token-action-btn activate-btn"
                      onClick={() => updateTokenStatus(token.id, 'ACTIVE')}
                    >
                      Kích hoạt Token
                    </button>
                  ) : null}
                  <button 
                    className="token-action-btn delete-btn"
                    onClick={() => deleteToken(token.id)}
                  >
                    <FiTrash2 /> Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopTokens; 