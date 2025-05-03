import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiArrowLeft, FiShoppingBag, FiMessageSquare, FiPower, FiAlertCircle, 
  FiCheckCircle, FiX, FiRefreshCw, FiSend, FiClock, FiUser, FiMessageCircle,
  FiEye, FiEyeOff, FiCopy, FiMonitor, FiPackage
} from 'react-icons/fi';
import {
  FaTelegram, FaPowerOff, FaFacebookMessenger, FaGlobe
} from 'react-icons/fa';
import shopService from '../services/shopService';
import telegramService from '../services/telegramService';
import integrationTokenService from '../services/integrationTokenService';
import Footer from '../layouts/Footer';
import '../assets/css/shop-config.css';

const ShopConfig = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  
  const [shop, setShop] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [messages, setMessages] = useState([]);
  const [botStatus, setBotStatus] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showToken, setShowToken] = useState(false);
  
  // Form state for sending message
  const [messageForm, setMessageForm] = useState({
    chatId: '',
    message: ''
  });
  const [sendingMessage, setSendingMessage] = useState(false);

  const [activeTab, setActiveTab] = useState('telegram');

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

  // Lấy danh sách token Telegram của shop
  const fetchTelegramTokens = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const tokensData = await integrationTokenService.getTokensByShopId(shopId);
      // Lọc ra chỉ các token Telegram
      const telegramTokens = tokensData.filter(token => token.method === 'TELEGRAM');
      setTokens(telegramTokens);
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

  // Lấy trạng thái bot
  const fetchBotStatus = useCallback(async () => {
    try {
      setStatusLoading(true);
      const status = await telegramService.getBotStatus(shopId);
      setBotStatus(status.running);
    } catch (err) {
      console.error('Error fetching bot status:', err);
      // Không hiển thị lỗi này cho người dùng vì có thể bot chưa được cấu hình
    } finally {
      setStatusLoading(false);
    }
  }, [shopId]);

  // Lấy danh sách tin nhắn
  const fetchMessages = useCallback(async () => {
    try {
      setMessagesLoading(true);
      const messagesData = await telegramService.getMessages(shopId);
      setMessages(messagesData);
    } catch (err) {
      console.error('Error fetching messages:', err);
      // Không hiển thị lỗi này cho người dùng
    } finally {
      setMessagesLoading(false);
    }
  }, [shopId]);

  // Khởi động bot
  const handleStartBot = async () => {
    try {
      setStatusLoading(true);
      setError(null);
      const response = await telegramService.startBot(shopId);
      if (response.status === 'Bot started successfully') {
        setBotStatus(true);
        setSuccess('Bot Telegram đã được khởi động thành công!');
      }
    } catch (err) {
      console.error('Error starting bot:', err);
      setError('Không thể khởi động bot. Vui lòng kiểm tra token Telegram.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Dừng bot
  const handleStopBot = async () => {
    try {
      setStatusLoading(true);
      setError(null);
      const response = await telegramService.stopBot(shopId);
      if (response.status === 'Bot stopped successfully') {
        setBotStatus(false);
        setSuccess('Bot Telegram đã được dừng thành công!');
      }
    } catch (err) {
      console.error('Error stopping bot:', err);
      setError('Không thể dừng bot. Vui lòng thử lại sau.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Gửi tin nhắn
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageForm.chatId.trim() || !messageForm.message.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin chat ID và nội dung tin nhắn');
      return;
    }

    try {
      setSendingMessage(true);
      setError(null);
      await telegramService.sendMessage(
        shopId, 
        messageForm.chatId, 
        messageForm.message
      );
      setSuccess('Tin nhắn đã được gửi thành công!');
      setMessageForm({
        chatId: '',
        message: ''
      });
      // Refresh tin nhắn
      fetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Không thể gửi tin nhắn. Vui lòng kiểm tra lại Chat ID.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Copy token to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Đã sao chép token vào clipboard!');
  };

  // Format token for display (hide part of it)
  const formatToken = (token) => {
    if (!token) return '';
    if (showToken) return token;
    if (token.length <= 8) return '••••••••';
    return token.substring(0, 4) + '••••••••••••••••' + token.substring(token.length - 4);
  };

  // Form handlers
  const handleMessageFormChange = (e) => {
    const { name, value } = e.target;
    setMessageForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Auto-fill chatId when clicking on a message
  const fillChatId = (chatId) => {
    setMessageForm(prev => ({
      ...prev,
      chatId: chatId.toString()
    }));
    // Focus vào input message
    document.getElementById('message').focus();
  };

  // Load data khi component được mount
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    fetchShopDetails();
    fetchTelegramTokens();
    fetchBotStatus();
    fetchMessages();

    // Cập nhật tin nhắn theo định kỳ
    const messagesInterval = setInterval(fetchMessages, 30000); // Cập nhật mỗi 30 giây
    const statusInterval = setInterval(fetchBotStatus, 30000); // Cập nhật trạng thái bot mỗi 30 giây

    return () => {
      clearInterval(messagesInterval);
      clearInterval(statusInterval);
    };
  }, [fetchShopDetails, fetchTelegramTokens, fetchBotStatus, fetchMessages, isAuthenticated, navigate]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Format date to readable format
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleString('vi-VN');
  };

  return (
    <div className="shop-config-container">
      <div className="config-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          <FiArrowLeft /> Quay lại Dashboard
        </button>
        <h1>
          <FiShoppingBag className="shop-icon" /> 
          {isLoading ? 'Đang tải...' : (shop ? shop.name : 'Cửa hàng')}
        </h1>
        <div className="header-logo">
          <div className="logo-icon">AI</div>
          <span className="logo-text">Assistant</span>
        </div>
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

      <div className="config-grid">
        {/* Integration Control Section with Tabs */}
        <div className="config-section telegram-control">
          <div className="integration-tabs">
            <button 
              className={`tab-btn ${activeTab === 'telegram' ? 'active' : ''}`}
              onClick={() => setActiveTab('telegram')}
            >
              <FaTelegram className="tab-icon" /> Telegram
            </button>
            <button 
              className={`tab-btn ${activeTab === 'facebook' ? 'active' : ''}`}
              onClick={() => setActiveTab('facebook')}
            >
              <FaFacebookMessenger className="tab-icon" /> Facebook 
            </button>
            <button 
              className={`tab-btn ${activeTab === 'iframe' ? 'active' : ''}`}
              onClick={() => setActiveTab('iframe')}
            >
              <FaGlobe className="tab-icon" /> Iframe Website
            </button>
            <button 
              className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <FiPackage className="tab-icon" /> Sản phẩm
            </button>
          </div>
          
          {/* Telegram Tab Content */}
          {activeTab === 'telegram' && (
            <div className="tab-content">
              <div className="bot-status">
                <div className="status-info">
                  <div className={`status-indicator ${botStatus ? 'active' : 'inactive'}`}>
                    <span className="status-dot"></span>
                    <span className="status-text">
                      {statusLoading ? 'Đang kiểm tra...' : (botStatus ? 'Đang hoạt động' : 'Không hoạt động')}
                    </span>
                  </div>
                </div>
                
                <div className="bot-actions">
                  {botStatus ? (
                    <button 
                      className="bot-action-btn stop-btn" 
                      onClick={handleStopBot}
                      disabled={statusLoading || tokens.length === 0}
                    >
                      {statusLoading ? <FiRefreshCw className="spinning" /> : <FaPowerOff />} Dừng Bot
                    </button>
                  ) : (
                    <button 
                      className="bot-action-btn start-btn" 
                      onClick={handleStartBot}
                      disabled={statusLoading || tokens.length === 0}
                    >
                      {statusLoading ? <FiRefreshCw className="spinning" /> : <FaPowerOff />} Khởi động Bot
                    </button>
                  )}
                </div>
              </div>

              {tokens.length === 0 ? (
                <div className="no-tokens">
                  <p>Chưa có token Telegram nào được cấu hình.</p>
                  <button 
                    className="add-token-btn"
                    onClick={() => navigate(`/shop/${shopId}/tokens`)}
                  >
                    Thêm Token Telegram
                  </button>
                </div>
              ) : (
                <div className="manage-tokens-container">
                  <button 
                    className="manage-tokens-btn"
                    onClick={() => navigate(`/shop/${shopId}/tokens`)}
                  >
                    Quản lý Tokens
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Facebook Tab Content */}
          {activeTab === 'facebook' && (
            <div className="tab-content">
              <div className="coming-soon">
                <p>Tính năng đang được phát triển. Vui lòng quay lại sau.</p>
              </div>
            </div>
          )}
          
          {/* Iframe Website Tab Content */}
          {activeTab === 'iframe' && (
            <div className="tab-content">
              <div className="coming-soon">
                <p>Tính năng đang được phát triển. Vui lòng quay lại sau.</p>
              </div>
            </div>
          )}
          
          {/* Products Tab Content */}
          {activeTab === 'products' && (
            <div className="tab-content">
              <div className="products-info">
                <h3>Quản lý sản phẩm của cửa hàng</h3>
                <p>Quản lý danh sách sản phẩm, thêm sản phẩm mới và cập nhật tồn kho.</p>
                <button 
                  className="go-to-products-btn"
                  onClick={() => navigate(`/shop/${shopId}/products`)}
                >
                  <FiPackage className="btn-icon" /> Đi đến trang quản lý sản phẩm
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Messages Section */}
        <div className="config-section messages">
          <div className="section-header">
            <h2><FiMessageCircle className="section-icon" /> Tin nhắn gần đây</h2>
            <button 
              className="refresh-btn" 
              onClick={fetchMessages}
              disabled={messagesLoading}
            >
              <FiRefreshCw className={messagesLoading ? 'spinning' : ''} />
            </button>
          </div>

          {messagesLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Đang tải tin nhắn...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="no-messages">
              <p>Chưa có tin nhắn nào.</p>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map(message => (
                <div 
                  key={message.id} 
                  className="message-item"
                  onClick={() => fillChatId(message.chatId)}
                >
                  <div className="message-header">
                    <div className="user-info">
                      <FiUser className="user-icon" />
                      <span className="username">{message.username || 'Người dùng'}</span>
                    </div>
                    <div className="message-time">
                      <FiClock className="time-icon" />
                      <span>{formatDateTime(message.receivedAt)}</span>
                    </div>
                  </div>
                  <div className="message-content">
                    {message.messageText}
                  </div>
                  <div className="message-footer">
                    <span className="chat-id">Chat ID: {message.chatId}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Send Message Section */}
        <div className="config-section send-message">
          <div className="section-header">
            <h2><FiSend className="section-icon" /> Gửi tin nhắn</h2>
          </div>
          
          <form onSubmit={handleSendMessage} className="message-form">
            <div className="form-group">
              <label htmlFor="chatId">Chat ID</label>
              <input
                type="text"
                id="chatId"
                name="chatId"
                value={messageForm.chatId}
                onChange={handleMessageFormChange}
                placeholder="Nhập Chat ID"
                required
                className="form-control"
              />
              <small>Chọn một tin nhắn để tự động điền Chat ID</small>
            </div>
            <div className="form-group">
              <label htmlFor="message">Nội dung tin nhắn</label>
              <textarea
                id="message"
                name="message"
                value={messageForm.message}
                onChange={handleMessageFormChange}
                placeholder="Nhập nội dung tin nhắn..."
                required
                className="form-control"
                rows="4"
              />
            </div>
            <button
              type="submit"
              className="send-btn"
              disabled={sendingMessage || !botStatus || !messageForm.chatId || !messageForm.message}
            >
              {sendingMessage ? (
                <>
                  <FiRefreshCw className="spinning" /> Đang gửi...
                </>
              ) : (
                <>
                  <FiSend /> Gửi tin nhắn
                </>
              )}
            </button>
            {!botStatus && (
              <div className="send-warning">
                <FiAlertCircle className="warning-icon" />
                <span>Bot đang không hoạt động. Vui lòng khởi động bot trước khi gửi tin nhắn.</span>
              </div>
            )}
          </form>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ShopConfig; 