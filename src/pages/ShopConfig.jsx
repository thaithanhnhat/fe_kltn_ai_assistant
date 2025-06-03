import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiArrowLeft, FiShoppingBag, FiMessageSquare, FiPower, FiAlertCircle, 
  FiCheckCircle, FiX, FiRefreshCw, FiSend, FiClock, FiUser, FiMessageCircle,
  FiEye, FiEyeOff, FiCopy, FiMonitor, FiPackage, FiChevronDown, FiChevronUp,
  FiMail, FiBell, FiSearch, FiCode, FiLink, FiDatabase, FiShield
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

  // State for expanded customer conversations
  const [expandedCustomers, setExpandedCustomers] = useState({});
  const [activeCustomer, setActiveCustomer] = useState(null);

  // Add searchTerm state for customer filtering
  const [searchTerm, setSearchTerm] = useState('');

  // State for API modal
  const [selectedApi, setSelectedApi] = useState(null);

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

  // Group messages by chatId (customer)
  const groupMessagesByCustomer = useCallback(() => {
    const groupedMessages = {};
    
    messages.forEach(message => {
      if (!groupedMessages[message.chatId]) {
        groupedMessages[message.chatId] = {
          chatId: message.chatId,
          username: message.username || 'Người dùng',
          messages: [],
          lastMessageTime: new Date(message.receivedAt)
        };
      }
      
      groupedMessages[message.chatId].messages.push(message);
      
      // Update the last message time if this message is newer
      const messageTime = new Date(message.receivedAt);
      if (messageTime > groupedMessages[message.chatId].lastMessageTime) {
        groupedMessages[message.chatId].lastMessageTime = messageTime;
      }
    });
    
    // Sort by most recent message
    return Object.values(groupedMessages).sort((a, b) => 
      b.lastMessageTime - a.lastMessageTime
    );
  }, [messages]);

  // Toggle customer conversation expansion
  const toggleCustomerExpansion = (chatId) => {
    setExpandedCustomers(prev => ({
      ...prev,
      [chatId]: !prev[chatId]
    }));
    
    // If we're opening this customer and none is active, set as active
    if (!expandedCustomers[chatId] && !activeCustomer) {
      setActiveCustomer(chatId);
    }
  };
  
  // Set active customer for message sending
  const setCustomerActive = (chatId) => {
    setActiveCustomer(chatId);
    fillChatId(chatId);
  };

  // Filter customers based on search term
  const filteredCustomers = useCallback(() => {
    const customers = groupMessagesByCustomer();
    if (!searchTerm.trim()) return customers;
    
    return customers.filter(customer => 
      customer.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
      customer.chatId.toString().includes(searchTerm)
    );
  }, [groupMessagesByCustomer, searchTerm]);

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
              className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`}
              onClick={() => setActiveTab('api')}
            >
              <FiCode className="tab-icon" /> API Website
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
          
          {/* API Website Tab Content */}
          {activeTab === 'api' && (
            <div className="tab-content">
              <div className="api-section">
                <h3><FiCode className="section-icon" /> API Endpoints Overview</h3>
                <p>Danh sách tất cả các API endpoints được sử dụng bởi website của bạn</p>
                
                {/* Access Key Section */}
                <div className="access-key-section">
                  <h4><FiShield className="category-icon" /> Access Key</h4>
                  <div className="access-key-container">
                    <div className="access-key-item">
                      <span className="access-key-label">API Key:</span>
                      <div className="access-key-display">
                        <code className="access-key-value">AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY</code>
                        <button 
                          className="copy-key-btn"
                          onClick={() => navigator.clipboard.writeText('AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY')}
                          title="Copy API Key"
                        >
                          <FiCopy />
                        </button>
                      </div>
                    </div>
                    <div className="access-key-info">
                      <p><FiAlertCircle /> Sử dụng API Key này trong header Authorization: Bearer YOUR_API_KEY</p>
                    </div>
                  </div>
                </div>
                
                <div className="api-categories">
                  {/* Shop Management APIs */}
                  <div className="api-category">
                    <h4><FiShoppingBag className="category-icon" /> Shop Management</h4>
                    <div className="api-list">
                      <div className="api-item" onClick={() => setSelectedApi({
                        method: 'GET',
                        path: '/api/shops',
                        description: 'Lấy danh sách cửa hàng',
                        headers: {
                          'Authorization': 'Bearer AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY',
                          'Content-Type': 'application/json'
                        },
                        payload: null,
                        response: {
                          success: true,
                          data: [
                            {
                              id: 1,
                              name: "Cửa hàng ABC",
                              description: "Mô tả cửa hàng",
                              ownerId: 123,
                              createdAt: "2024-01-01T00:00:00Z"
                            }
                          ]
                        }
                      })}>
                        <div className="api-method get">GET</div>
                        <div className="api-details">
                          <div className="api-path">/api/shops</div>
                          <div className="api-description">Lấy danh sách cửa hàng</div>
                        </div>
                        <div className="api-status active">Active</div>
                      </div>
                      <div className="api-item" onClick={() => setSelectedApi({
                        method: 'GET',
                        path: '/api/shops/:id',
                        description: 'Lấy thông tin chi tiết cửa hàng',
                        headers: {
                          'Authorization': 'Bearer AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY',
                          'Content-Type': 'application/json'
                        },
                        payload: null,
                        response: {
                          success: true,
                          data: {
                            id: 1,
                            name: "Cửa hàng ABC",
                            description: "Mô tả cửa hàng",
                            ownerId: 123,
                            products: [],
                            createdAt: "2024-01-01T00:00:00Z"
                          }
                        }
                      })}>
                        <div className="api-method get">GET</div>
                        <div className="api-details">
                          <div className="api-path">/api/shops/:id</div>
                          <div className="api-description">Lấy thông tin chi tiết cửa hàng</div>
                        </div>
                        <div className="api-status active">Active</div>
                      </div>
                      <div className="api-item" onClick={() => setSelectedApi({
                        method: 'POST',
                        path: '/api/shops',
                        description: 'Tạo cửa hàng mới',
                        headers: {
                          'Authorization': 'Bearer AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY',
                          'Content-Type': 'application/json'
                        },
                        payload: {
                          name: "Tên cửa hàng",
                          description: "Mô tả cửa hàng",
                          category: "electronics"
                        },
                        response: {
                          success: true,
                          data: {
                            id: 2,
                            name: "Tên cửa hàng",
                            description: "Mô tả cửa hàng",
                            ownerId: 123,
                            createdAt: "2024-01-01T00:00:00Z"
                          }
                        }
                      })}>
                        <div className="api-method post">POST</div>
                        <div className="api-details">
                          <div className="api-path">/api/shops</div>
                          <div className="api-description">Tạo cửa hàng mới</div>
                        </div>
                        <div className="api-status active">Active</div>
                      </div>
                      <div className="api-item" onClick={() => setSelectedApi({
                        method: 'PUT',
                        path: '/api/shops/:id',
                        description: 'Cập nhật thông tin cửa hàng',
                        headers: {
                          'Authorization': 'Bearer AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY',
                          'Content-Type': 'application/json'
                        },
                        payload: {
                          name: "Tên cửa hàng mới",
                          description: "Mô tả cửa hàng mới"
                        },
                        response: {
                          success: true,
                          data: {
                            id: 1,
                            name: "Tên cửa hàng mới",
                            description: "Mô tả cửa hàng mới",
                            ownerId: 123,
                            updatedAt: "2024-01-01T00:00:00Z"
                          }
                        }
                      })}>
                        <div className="api-method put">PUT</div>
                        <div className="api-details">
                          <div className="api-path">/api/shops/:id</div>
                          <div className="api-description">Cập nhật thông tin cửa hàng</div>
                        </div>
                        <div className="api-status active">Active</div>
                      </div>
                    </div>
                  </div>

                  {/* Product Management APIs */}
                  <div className="api-category">
                    <h4><FiPackage className="category-icon" /> Product Management</h4>
                    <div className="api-list">
                      <div className="api-item" onClick={() => setSelectedApi({
                        method: 'GET',
                        path: '/api/shops/:shopId/products',
                        description: 'Lấy danh sách sản phẩm theo cửa hàng',
                        headers: {
                          'Authorization': 'Bearer AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY',
                          'Content-Type': 'application/json'
                        },
                        payload: null,
                        response: {
                          success: true,
                          data: [
                            {
                              id: 1,
                              name: "Sản phẩm A",
                              price: 100000,
                              stock: 50,
                              description: "Mô tả sản phẩm",
                              shopId: 1
                            }
                          ]
                        }
                      })}>
                        <div className="api-method get">GET</div>
                        <div className="api-details">
                          <div className="api-path">/api/shops/:shopId/products</div>
                          <div className="api-description">Lấy danh sách sản phẩm theo cửa hàng</div>
                        </div>
                        <div className="api-status active">Active</div>
                      </div>
                      <div className="api-item" onClick={() => setSelectedApi({
                        method: 'POST',
                        path: '/api/shops/:shopId/products',
                        description: 'Tạo sản phẩm mới',
                        headers: {
                          'Authorization': 'Bearer AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY',
                          'Content-Type': 'application/json'
                        },
                        payload: {
                          name: "Tên sản phẩm",
                          price: 150000,
                          stock: 100,
                          description: "Mô tả sản phẩm",
                          category: "electronics"
                        },
                        response: {
                          success: true,
                          data: {
                            id: 2,
                            name: "Tên sản phẩm",
                            price: 150000,
                            stock: 100,
                            description: "Mô tả sản phẩm",
                            shopId: 1,
                            createdAt: "2024-01-01T00:00:00Z"
                          }
                        }
                      })}>
                        <div className="api-method post">POST</div>
                        <div className="api-details">
                          <div className="api-path">/api/shops/:shopId/products</div>
                          <div className="api-description">Tạo sản phẩm mới</div>
                        </div>
                        <div className="api-status active">Active</div>
                      </div>
                      <div className="api-item" onClick={() => setSelectedApi({
                        method: 'PUT',
                        path: '/api/products/:id',
                        description: 'Cập nhật sản phẩm',
                        headers: {
                          'Authorization': 'Bearer AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY',
                          'Content-Type': 'application/json'
                        },
                        payload: {
                          name: "Tên sản phẩm mới",
                          price: 200000,
                          stock: 75
                        },
                        response: {
                          success: true,
                          data: {
                            id: 1,
                            name: "Tên sản phẩm mới",
                            price: 200000,
                            stock: 75,
                            updatedAt: "2024-01-01T00:00:00Z"
                          }
                        }
                      })}>
                        <div className="api-method put">PUT</div>
                        <div className="api-details">
                          <div className="api-path">/api/products/:id</div>
                          <div className="api-description">Cập nhật sản phẩm</div>
                        </div>
                        <div className="api-status active">Active</div>
                      </div>
                      <div className="api-item" onClick={() => setSelectedApi({
                        method: 'DELETE',
                        path: '/api/products/:id',
                        description: 'Xóa sản phẩm',
                        headers: {
                          'Authorization': 'Bearer AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY',
                          'Content-Type': 'application/json'
                        },
                        payload: null,
                        response: {
                          success: true,
                          message: "Sản phẩm đã được xóa thành công"
                        }
                      })}>
                        <div className="api-method delete">DELETE</div>
                        <div className="api-details">
                          <div className="api-path">/api/products/:id</div>
                          <div className="api-description">Xóa sản phẩm</div>
                        </div>
                        <div className="api-status active">Active</div>
                      </div>
                    </div>
                  </div>

                  {/* AI Agent APIs */}
                  <div className="api-category">
                    <h4><FiCode className="category-icon" /> AI Agent APIs</h4>
                    <div className="api-list">
                      <div className="api-item" onClick={() => setSelectedApi({
                        method: 'POST',
                        path: '/api/ai/callfunction',
                        description: 'Gọi function AI để xử lý yêu cầu từ khách hàng',
                        headers: {
                          'Authorization': 'Bearer AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY',
                          'Content-Type': 'application/json'
                        },
                        payload: {
                          function: "product_recommendation",
                          parameters: {
                            userId: 123,
                            category: "electronics",
                            budget: 1000000,
                            preferences: ["performance", "design"]
                          },
                          context: {
                            shopId: shopId,
                            conversationId: "conv_123"
                          }
                        },
                        response: {
                          success: true,
                          data: {
                            recommendations: [
                              {
                                productId: 1,
                                name: "iPhone 15 Pro",
                                score: 0.95,
                                reason: "Phù hợp với ngân sách và sở thích về hiệu năng",
                                price: 950000,
                                features: ["A17 Pro chip", "Titanium design", "48MP camera"]
                              },
                              {
                                productId: 2,
                                name: "Samsung Galaxy S24",
                                score: 0.88,
                                reason: "Thiết kế đẹp và hiệu năng cao",
                                price: 850000,
                                features: ["Snapdragon 8 Gen 3", "AI Photography", "120Hz Display"]
                              }
                            ],
                            totalResults: 2,
                            processingTime: "1.2s"
                          }
                        }
                      })}>
                        <div className="api-method post">POST</div>
                        <div className="api-details">
                          <div className="api-path">/api/ai/callfunction</div>
                          <div className="api-description">Gọi function AI để xử lý yêu cầu từ khách hàng</div>
                        </div>
                        <div className="api-status active">Active</div>
                      </div>
                      
                      <div className="api-item" onClick={() => setSelectedApi({
                        method: 'POST',
                        path: '/api/ai/support',
                        description: 'AI hỗ trợ khách hàng và tư vấn sản phẩm',
                        headers: {
                          'Authorization': 'Bearer AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY',
                          'Content-Type': 'application/json'
                        },
                        payload: {
                          message: "Tôi cần hỗ trợ về sản phẩm iPhone 15",
                          userId: 123,
                          context: {
                            shopId: shopId,
                            previousConversation: ["Xin chào", "Tôi muốn mua điện thoại"],
                            customerProfile: {
                              age: 25,
                              interests: ["technology", "gaming"]
                            }
                          },
                          supportType: "product_inquiry"
                        },
                        response: {
                          success: true,
                          data: {
                            response: "Chào bạn! iPhone 15 là sản phẩm rất tuyệt vời. Với chip A17 Pro mạnh mẽ và camera 48MP chuyên nghiệp, nó rất phù hợp cho gaming và chụp ảnh. Bạn có muốn tôi so sánh với các model khác không?",
                            suggestions: [
                              "So sánh iPhone 15 vs iPhone 15 Pro",
                              "Xem thông số kỹ thuật chi tiết",
                              "Tư vấn phụ kiện đi kèm",
                              "Hỗ trợ thanh toán trả góp"
                            ],
                            confidence: 0.92,
                            followUpQuestions: [
                              "Ngân sách của bạn là bao nhiêu?",
                              "Bạn chủ yếu dùng điện thoại để làm gì?"
                            ]
                          }
                        }
                      })}>
                        <div className="api-method post">POST</div>
                        <div className="api-details">
                          <div className="api-path">/api/ai/support</div>
                          <div className="api-description">AI hỗ trợ khách hàng và tư vấn sản phẩm</div>
                        </div>
                        <div className="api-status active">Active</div>
                      </div>
                      
                      <div className="api-item" onClick={() => setSelectedApi({
                        method: 'POST',
                        path: '/api/ai/analyze',
                        description: 'Phân tích dữ liệu khách hàng và xu hướng bán hàng',
                        headers: {
                          'Authorization': 'Bearer AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY',
                          'Content-Type': 'application/json'
                        },
                        payload: {
                          type: "customer_behavior",
                          shopId: shopId,
                          timeRange: "30days",
                          metrics: ["sales", "engagement", "satisfaction"],
                          filters: {
                            customerAge: [18, 35],
                            productCategory: "electronics"
                          }
                        },
                        response: {
                          success: true,
                          data: {
                            insights: {
                              totalCustomers: 150,
                              activeCustomers: 45,
                              avgOrderValue: 850000,
                              conversionRate: 0.23,
                              topProducts: [
                                { name: "iPhone 15", sales: 25, revenue: 23750000 },
                                { name: "Samsung Galaxy S24", sales: 18, revenue: 15300000 }
                              ],
                              customerSegments: {
                                "High Value": 15,
                                "Regular": 85,
                                "New": 50
                              },
                              peakHours: ["14:00-16:00", "19:00-21:00"],
                              recommendations: [
                                "Tăng cường marketing cho sản phẩm điện tử vào khung giờ 14-16h",
                                "Tạo chương trình loyalty cho khách hàng High Value",
                                "Phát triển chatbot cho support khách hàng mới"
                              ]
                            },
                            trends: {
                              salesGrowth: "+15%",
                              customerSatisfaction: "4.2/5",
                              returnRate: "2.3%"
                            }
                          }
                        }
                      })}>
                        <div className="api-method post">POST</div>
                        <div className="api-details">
                          <div className="api-path">/api/ai/analyze</div>
                          <div className="api-description">Phân tích dữ liệu khách hàng và xu hướng bán hàng</div>
                        </div>
                        <div className="api-status active">Active</div>
                      </div>
                      
                      <div className="api-item" onClick={() => setSelectedApi({
                        method: 'POST',
                        path: '/api/ai/generate-content',
                        description: 'Tạo nội dung marketing và mô tả sản phẩm bằng AI',
                        headers: {
                          'Authorization': 'Bearer AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY',
                          'Content-Type': 'application/json'
                        },
                        payload: {
                          type: "product_description",
                          productName: "iPhone 15 Pro Max",
                          features: ["A17 Pro chip", "Titanium design", "48MP camera", "5x zoom"],
                          tone: "professional",
                          target_audience: "tech_enthusiasts",
                          length: "medium",
                          include_specs: true
                        },
                        response: {
                          success: true,
                          data: {
                            content: "🚀 **iPhone 15 Pro Max - Đỉnh cao công nghệ trong tầm tay**\n\nTrải nghiệm sức mạnh vượt trội với chip A17 Pro tiên tiến nhất, mang đến hiệu năng đỉnh cao cho mọi tác vụ từ gaming đến sáng tạo nội dung. Thiết kế titanium sang trọng không chỉ bền bỉ mà còn nhẹ nhàng đáng kinh ngạc.\n\n📸 **Camera 48MP Pro với zoom 5x** - Chụp ảnh chuyên nghiệp, quay video ProRes, mọi khoảnh khắc đều trở nên sống động và sắc nét.\n\n✨ **Tính năng nổi bật:**\n- A17 Pro: Nhanh hơn 20% so với thế hệ trước\n- Titanium: Nhẹ hơn 19g, bền gấp 4 lần\n- Camera Pro: Chế độ chân dung mới, Night mode cải tiến\n- Action Button: Tùy chỉnh theo ý muốn\n\n💎 Đây không chỉ là smartphone, mà là công cụ sáng tạo hoàn hảo cho những ai đam mê công nghệ!",
                            keywords: ["iPhone 15 Pro Max", "A17 Pro", "Titanium", "48MP camera", "5x zoom", "ProRes"],
                            hashtags: ["#iPhone15ProMax", "#Apple", "#TechLovers", "#ProCamera"],
                            seo_score: 0.89,
                            readability: "Easy"
                          }
                        }
                      })}>
                        <div className="api-method post">POST</div>
                        <div className="api-details">
                          <div className="api-path">/api/ai/generate-content</div>
                          <div className="api-description">Tạo nội dung marketing và mô tả sản phẩm bằng AI</div>
                        </div>
                        <div className="api-status active">Active</div>
                      </div>
                      
                      <div className="api-item" onClick={() => setSelectedApi({
                        method: 'POST',
                        path: '/api/ai/sentiment-analysis',
                        description: 'Phân tích cảm xúc và phản hồi của khách hàng',
                        headers: {
                          'Authorization': 'Bearer AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY',
                          'Content-Type': 'application/json'
                        },
                        payload: {
                          messages: [
                            "Sản phẩm tuyệt vời, tôi rất hài lòng!",
                            "Giao hàng hơi chậm nhưng chất lượng ok",
                            "Giá cả hợp lý, dịch vụ tốt"
                          ],
                          shopId: shopId,
                          timeframe: "7days"
                        },
                        response: {
                          success: true,
                          data: {
                            overall_sentiment: {
                              score: 0.72,
                              label: "Positive",
                              confidence: 0.89
                            },
                            detailed_analysis: [
                              {
                                message: "Sản phẩm tuyệt vời, tôi rất hài lòng!",
                                sentiment: "very_positive",
                                score: 0.95,
                                aspects: {
                                  "product_quality": 0.98,
                                  "satisfaction": 0.92
                                }
                              },
                              {
                                message: "Giao hàng hơi chậm nhưng chất lượng ok",
                                sentiment: "mixed",
                                score: 0.45,
                                aspects: {
                                  "delivery": -0.3,
                                  "product_quality": 0.7
                                }
                              }
                            ],
                            insights: {
                              strengths: ["Chất lượng sản phẩm tốt", "Dịch vụ khách hàng"],
                              areas_for_improvement: ["Tốc độ giao hàng", "Thời gian phản hồi"],
                              customer_satisfaction: "4.2/5"
                            }
                          }
                        }
                      })}>
                        <div className="api-method post">POST</div>
                        <div className="api-details">
                          <div className="api-path">/api/ai/sentiment-analysis</div>
                          <div className="api-description">Phân tích cảm xúc và phản hồi của khách hàng</div>
                        </div>
                        <div className="api-status active">Active</div>
                      </div>
                      
                      <div className="api-item" onClick={() => setSelectedApi({
                        method: 'POST',
                        path: '/api/ai/chatbot',
                        description: 'Chatbot thông minh cho hỗ trợ khách hàng 24/7',
                        headers: {
                          'Authorization': 'Bearer AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY',
                          'Content-Type': 'application/json'
                        },
                        payload: {
                          message: "Tôi muốn trả hàng",
                          userId: 123,
                          sessionId: "session_456",
                          context: {
                            orderId: "ORD-001",
                            purchaseDate: "2024-12-01",
                            productName: "iPhone 15"
                          }
                        },
                        response: {
                          success: true,
                          data: {
                            response: "Tôi hiểu bạn muốn trả lại sản phẩm iPhone 15 (đơn hàng ORD-001). Theo chính sách của chúng tôi, bạn có thể trả hàng trong vòng 30 ngày kể từ ngày mua. Vui lòng cho tôi biết lý do trả hàng để tôi hỗ trợ bạn tốt nhất.",
                            quickReplies: [
                              "Sản phẩm bị lỗi",
                              "Không đúng mô tả",
                              "Thay đổi ý định",
                              "Nói chuyện với nhân viên"
                            ],
                            actions: [
                              {
                                type: "create_return_request",
                                label: "Tạo yêu cầu trả hàng",
                                url: "/return-request"
                              }
                            ],
                            escalate_to_human: false,
                            confidence: 0.91
                          }
                        }
                      })}>
                        <div className="api-method post">POST</div>
                        <div className="api-details">
                          <div className="api-path">/api/ai/chatbot</div>
                          <div className="api-description">Chatbot thông minh cho hỗ trợ khách hàng 24/7</div>
                        </div>
                        <div className="api-status active">Active</div>
                      </div>
                      
                      <div className="api-item" onClick={() => setSelectedApi({
                        method: 'POST',
                        path: '/api/ai/price-optimization',
                        description: 'Tối ưu giá sản phẩm dựa trên AI và thị trường',
                        headers: {
                          'Authorization': 'Bearer AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY',
                          'Content-Type': 'application/json'
                        },
                        payload: {
                          productId: 1,
                          currentPrice: 1000000,
                          competitors: [
                            { name: "Shop A", price: 950000 },
                            { name: "Shop B", price: 1050000 }
                          ],
                          salesData: {
                            last30Days: 25,
                            clickThrough: 0.15,
                            conversionRate: 0.08
                          }
                        },
                        response: {
                          success: true,
                          data: {
                            recommendedPrice: 975000,
                            confidence: 0.87,
                            reasoning: "Giá được tối ưu dựa trên phân tích cạnh tranh và hành vi khách hàng. Giảm giá 2.5% có thể tăng doanh số 18%",
                            impact_analysis: {
                              expectedSalesIncrease: "18%",
                              revenueImpact: "+15%",
                              marketPosition: "competitive"
                            },
                            priceRange: {
                              min: 920000,
                              max: 1020000,
                              optimal: 975000
                            },
                            strategy: "penetration_pricing"
                          }
                        }
                      })}>
                        <div className="api-method post">POST</div>
                        <div className="api-details">
                          <div className="api-path">/api/ai/price-optimization</div>
                          <div className="api-description">Tối ưu giá sản phẩm dựa trên AI và thị trường</div>
                        </div>
                        <div className="api-status active">Active</div>
                      </div>
                      
                      <div className="api-item" onClick={() => setSelectedApi({
                        method: 'GET',
                        path: '/api/ai/conversation-history',
                        description: 'Lấy lịch sử hội thoại AI với khách hàng',
                        headers: {
                          'Authorization': 'Bearer AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY',
                          'Content-Type': 'application/json'
                        },
                        payload: null,
                        response: {
                          success: true,
                          data: {
                            conversations: [
                              {
                                id: "conv_123",
                                customerId: 456,
                                startTime: "2024-12-01T14:30:00Z",
                                endTime: "2024-12-01T14:45:00Z",
                                duration: "15 minutes",
                                status: "resolved",
                                satisfaction: 4.5,
                                messages: [
                                  {
                                    sender: "customer",
                                    message: "Tôi muốn mua iPhone 15",
                                    timestamp: "2024-12-01T14:30:15Z"
                                  },
                                  {
                                    sender: "ai",
                                    message: "Tuyệt vời! iPhone 15 có nhiều model khác nhau. Bạn quan tâm đến model nào?",
                                    timestamp: "2024-12-01T14:30:30Z"
                                  }
                                ],
                                summary: "Khách hàng quan tâm đến iPhone 15, đã tư vấn và hoàn thành đơn hàng",
                                tags: ["sales", "iphone", "completed"]
                              }
                            ],
                            total: 1,
                            stats: {
                              totalConversations: 150,
                              resolvedByAI: 95,
                              escalatedToHuman: 55,
                              avgSatisfaction: 4.2,
                              avgDuration: "12 minutes"
                            }
                          }
                        }
                      })}>
                        <div className="api-method get">GET</div>
                        <div className="api-details">
                          <div className="api-path">/api/ai/conversation-history</div>
                          <div className="api-description">Lấy lịch sử hội thoại AI với khách hàng</div>
                        </div>
                        <div className="api-status active">Active</div>
                      </div>
                      
                      <div className="api-item" onClick={() => setSelectedApi({
                        method: 'POST',
                        path: '/api/ai/recommendation',
                        description: 'AI gợi ý sản phẩm dựa trên hành vi khách hàng',
                        headers: {
                          'Authorization': 'Bearer AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY',
                          'Content-Type': 'application/json'
                        },
                        payload: {
                          customerId: 123,
                          currentProduct: "iPhone 15",
                          preferences: {
                            priceRange: [800, 1200],
                            categories: ["electronics", "accessories"],
                            brands: ["Apple", "Samsung"]
                          },
                          purchaseHistory: [
                            { productId: 1, category: "smartphone", brand: "Apple" },
                            { productId: 5, category: "accessories", brand: "Apple" }
                          ]
                        },
                        response: {
                          success: true,
                          data: {
                            recommendations: [
                              {
                                productId: 10,
                                name: "iPhone 15 Pro",
                                price: 1099,
                                confidence: 0.92,
                                reason: "Upgrade từ iPhone 15 thường với camera tốt hơn"
                              },
                              {
                                productId: 15,
                                name: "AirPods Pro",
                                price: 249,
                                confidence: 0.88,
                                reason: "Phụ kiện phù hợp với iPhone 15"
                              }
                            ],
                            totalRecommendations: 2,
                            algorithm: "collaborative_filtering_with_content_based"
                          }
                        }
                      })}>
                        <div className="api-method post">POST</div>
                        <div className="api-details">
                          <div className="api-path">/api/ai/recommendation</div>
                          <div className="api-description">AI gợi ý sản phẩm dựa trên hành vi khách hàng</div>
                        </div>
                        <div className="api-status active">Active</div>
                      </div>
                      
                      <div className="api-item" onClick={() => setSelectedApi({
                        method: 'POST',
                        path: '/api/ai/inventory-prediction',
                        description: 'Dự đoán tồn kho và nhu cầu sản phẩm',
                        headers: {
                          'Authorization': 'Bearer AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY',
                          'Content-Type': 'application/json'
                        },
                        payload: {
                          shopId: shopId,
                          productIds: [1, 2, 3, 4, 5],
                          timeHorizon: "30days",
                          includeSeasonality: true,
                          factorsToConsider: ["sales_trend", "market_events", "weather", "holidays"]
                        },
                        response: {
                          success: true,
                          data: {
                            predictions: [
                              {
                                productId: 1,
                                productName: "iPhone 15",
                                currentStock: 50,
                                predictedDemand: 75,
                                recommendedOrder: 25,
                                confidence: 0.89,
                                stockoutRisk: "low",
                                reorderDate: "2024-12-15"
                              }
                            ],
                            summary: {
                              totalProducts: 5,
                              highRiskProducts: 1,
                              totalRecommendedOrders: 85,
                              estimatedRevenue: 125000
                            }
                          }
                        }
                      })}>
                        <div className="api-method post">POST</div>
                        <div className="api-details">
                          <div className="api-path">/api/ai/inventory-prediction</div>
                          <div className="api-description">Dự đoán tồn kho và nhu cầu sản phẩm</div>
                        </div>
                        <div className="api-status active">Active</div>
                      </div>
                      
                      <div className="api-item" onClick={() => setSelectedApi({
                        method: 'POST',
                        path: '/api/ai/customer-segmentation',
                        description: 'Phân khúc khách hàng bằng AI machine learning',
                        headers: {
                          'Authorization': 'Bearer AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY',
                          'Content-Type': 'application/json'
                        },
                        payload: {
                          shopId: shopId,
                          analysisType: "behavioral_segmentation",
                          timeRange: "90days",
                          includeFactors: [
                            "purchase_frequency",
                            "average_order_value", 
                            "product_categories",
                            "engagement_level",
                            "loyalty_score"
                          ]
                        },
                        response: {
                          success: true,
                          data: {
                            segments: [
                              {
                                segmentId: "vip_customers",
                                name: "Khách hàng VIP",
                                size: 150,
                                characteristics: {
                                  avgOrderValue: 1500000,
                                  purchaseFrequency: "weekly",
                                  loyaltyScore: 9.2,
                                  preferredCategories: ["premium", "technology"]
                                },
                                recommendedActions: [
                                  "Offer exclusive products",
                                  "Personal shopping assistant",
                                  "Early access to sales"
                                ]
                              },
                              {
                                segmentId: "price_sensitive",
                                name: "Khách hàng nhạy cảm giá",
                                size: 320,
                                characteristics: {
                                  avgOrderValue: 300000,
                                  purchaseFrequency: "monthly",
                                  loyaltyScore: 6.5,
                                  preferredCategories: ["budget", "essentials"]
                                },
                                recommendedActions: [
                                  "Discount campaigns",
                                  "Bundle offers",
                                  "Price comparison tools"
                                ]
                              }
                            ],
                            totalCustomers: 470,
                            segmentationAccuracy: 0.94
                          }
                        }
                      })}>
                        <div className="api-method post">POST</div>
                        <div className="api-details">
                          <div className="api-path">/api/ai/customer-segmentation</div>
                          <div className="api-description">Phân khúc khách hàng bằng AI machine learning</div>
                        </div>
                        <div className="api-status active">Active</div>
                      </div>
                      
                      <div className="api-item" onClick={() => setSelectedApi({
                        method: 'POST',
                        path: '/api/ai/fraud-detection',
                        description: 'Phát hiện gian lận và hoạt động đáng ngờ',
                        headers: {
                          'Authorization': 'Bearer AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY',
                          'Content-Type': 'application/json'
                        },
                        payload: {
                          transactionId: "TXN_789456",
                          customerId: 123,
                          orderDetails: {
                            amount: 2500000,
                            products: [
                              { id: 1, name: "iPhone 15 Pro", price: 1200000, quantity: 2 },
                              { id: 5, name: "MacBook Pro", price: 1300000, quantity: 1 }
                            ],
                            paymentMethod: "credit_card",
                            shippingAddress: {
                              address: "123 Nguyen Trai, Q1, TPHCM",
                              isNewAddress: true
                            }
                          },
                          customerHistory: {
                            accountAge: "3months",
                            previousOrders: 2,
                            avgOrderValue: 500000,
                            hasDisputes: false
                          }
                        },
                        response: {
                          success: true,
                          data: {
                            riskScore: 0.75,
                            riskLevel: "medium",
                            fraudProbability: 0.12,
                            riskFactors: [
                              {
                                factor: "high_order_value",
                                weight: 0.3,
                                description: "Đơn hàng cao hơn 5x giá trị trung bình"
                              },
                              {
                                factor: "new_shipping_address",
                                weight: 0.25,
                                description: "Địa chỉ giao hàng chưa từng sử dụng"
                              },
                              {
                                factor: "account_age",
                                weight: 0.2,
                                description: "Tài khoản còn mới (< 6 tháng)"
                              }
                            ],
                            recommendation: "manual_review",
                            suggestedActions: [
                              "Verify customer phone number",
                              "Request additional identification",
                              "Limit quantity for high-value items"
                            ]
                          }
                        }
                      })}>
                        <div className="api-method post">POST</div>
                        <div className="api-details">
                          <div className="api-path">/api/ai/fraud-detection</div>
                          <div className="api-description">Phát hiện gian lận và hoạt động đáng ngờ</div>
                        </div>
                        <div className="api-status active">Active</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="api-summary">
                  <div className="summary-stats">
                    <div className="stat-item">
                      <div className="stat-number">25</div>
                      <div className="stat-label">Total APIs</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">25</div>
                      <div className="stat-label">Active</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">0</div>
                      <div className="stat-label">Inactive</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">3</div>
                      <div className="stat-label">Categories</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API Documentation Modal */}
          {selectedApi && (
            <div className="api-modal-overlay" onClick={() => setSelectedApi(null)}>
              <div className="api-modal" onClick={(e) => e.stopPropagation()}>
                <div className="api-modal-header">
                  <h3>
                    <span className={`api-method ${selectedApi.method.toLowerCase()}`}>
                      {selectedApi.method}
                    </span>
                    {selectedApi.path}
                  </h3>
                  <button 
                    className="api-modal-close"
                    onClick={() => setSelectedApi(null)}
                  >
                    <FiX />
                  </button>
                </div>
                
                <div className="api-modal-content">
                  <div className="api-description">
                    <p>{selectedApi.description}</p>
                  </div>
                  
                  <div className="api-section">
                    <h4><FiShield className="section-icon" /> Headers</h4>
                    <div className="code-block">
                      <pre>
                        <code>
{Object.entries(selectedApi.headers).map(([key, value]) => 
`${key}: ${value}`
).join('\n')}
                        </code>
                      </pre>
                      <button 
                        className="copy-code-btn"
                        onClick={() => {
                          const headersText = Object.entries(selectedApi.headers)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join('\n');
                          navigator.clipboard.writeText(headersText);
                        }}
                      >
                        <FiCopy />
                      </button>
                    </div>
                  </div>

                  {selectedApi.payload && (
                    <div className="api-section">
                      <h4><FiCode className="section-icon" /> Request Payload</h4>
                      <div className="code-block">
                        <pre>
                          <code>
{JSON.stringify(selectedApi.payload, null, 2)}
                          </code>
                        </pre>
                        <button 
                          className="copy-code-btn"
                          onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedApi.payload, null, 2))}
                        >
                          <FiCopy />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="api-section">
                    <h4><FiDatabase className="section-icon" /> Response</h4>
                    <div className="code-block">
                      <pre>
                        <code>
{JSON.stringify(selectedApi.response, null, 2)}
                        </code>
                      </pre>
                      <button 
                        className="copy-code-btn"
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedApi.response, null, 2))}
                      >
                        <FiCopy />
                      </button>
                    </div>
                  </div>

                  <div className="api-section">
                    <h4><FiLink className="section-icon" /> cURL Example</h4>
                    <div className="code-block">
                      <pre>
                        <code>
{`curl -X ${selectedApi.method} \\
  "${window.location.origin}${selectedApi.path}" \\
  -H "Authorization: Bearer AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY" \\
  -H "Content-Type: application/json"${selectedApi.payload ? ` \\
  -d '${JSON.stringify(selectedApi.payload)}'` : ''}`}
                        </code>
                      </pre>
                      <button 
                        className="copy-code-btn"
                        onClick={() => {
                          const curlCommand = `curl -X ${selectedApi.method} \\
  "${window.location.origin}${selectedApi.path}" \\
  -H "Authorization: Bearer AIzaSyB1EYnFlDSgFhqv3Kk4FDv1ukZvl4H7wBY" \\
  -H "Content-Type: application/json"${selectedApi.payload ? ` \\
  -d '${JSON.stringify(selectedApi.payload)}'` : ''}`;
                          navigator.clipboard.writeText(curlCommand);
                        }}
                      >
                        <FiCopy />
                      </button>
                    </div>
                  </div>
                </div>
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

        {/* Messenger-like interface */}
        <div className="config-section messenger-interface">
          <div className="messenger-container">
            {/* Left side - Customer list */}
            <div className="messenger-sidebar">
              <div className="messenger-header">
                <h2><FiMessageCircle className="section-icon" /> Khách hàng</h2>
                <button 
                  className="refresh-btn" 
                  onClick={fetchMessages}
                  disabled={messagesLoading}
                >
                  <FiRefreshCw className={messagesLoading ? 'spinning' : ''} />
                </button>
              </div>
              
              <div className="messenger-search">
                <div className="search-input-container">
                  <FiSearch className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm khách hàng..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  {searchTerm && (
                    <button 
                      className="clear-search-btn"
                      onClick={() => setSearchTerm('')}
                    >
                      <FiX />
                    </button>
                  )}
                </div>
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
                <div className="customers-list">
                  {filteredCustomers().map(customer => (
                    <div 
                      key={customer.chatId} 
                      className={`customer-item ${activeCustomer === customer.chatId ? 'active' : ''}`}
                      onClick={() => setCustomerActive(customer.chatId)}
                    >
                      <div className="customer-avatar">
                        <FiUser className="customer-icon" />
                      </div>
                      <div className="customer-info">
                        <div className="customer-details">
                          <span className="customer-name">{customer.username}</span>
                          <span className="last-message-time">
                            {formatDateTime(customer.lastMessageTime)}
                          </span>
                        </div>
                        <div className="message-preview">
                          {customer.messages[0]?.messageText.substring(0, 40)}
                          {customer.messages[0]?.messageText.length > 40 ? '...' : ''}
                        </div>
                      </div>
                      <div className="message-count">
                        <span>{customer.messages.length}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Right side - Conversation */}
            <div className="messenger-content">
              {activeCustomer ? (
                <>
                  <div className="conversation-header">
                    <div className="conversation-customer">
                      <div className="customer-avatar">
                        <FiUser className="customer-icon" />
                      </div>
                      <div className="customer-details">
                        <span className="customer-name">
                          {groupMessagesByCustomer().find(c => c.chatId === activeCustomer)?.username || 'Khách hàng'}
                        </span>
                        <span className="customer-chatid">Chat ID: {activeCustomer}</span>
                      </div>
                    </div>
                    <div className="conversation-actions">
                      <div className="bot-status-indicator">
                        <span className={`status-dot ${botStatus ? 'active' : 'inactive'}`}></span>
                        <span className="status-text">
                          {botStatus ? 'Bot đang hoạt động' : 'Bot không hoạt động'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="conversation-messages">
                    {groupMessagesByCustomer()
                      .find(c => c.chatId === activeCustomer)
                      ?.messages.sort((a, b) => new Date(a.receivedAt) - new Date(b.receivedAt))
                      .map(message => (
                        <div 
                          key={message.id} 
                          className="conversation-message"
                        >
                          <div className="message-bubble customer">
                            <div className="message-content">
                              {message.messageText}
                            </div>
                            <div className="message-time">
                              {formatDateTime(message.receivedAt)}
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                  
                  <div className="conversation-input">
                    <form onSubmit={handleSendMessage} className="message-form">
                      <textarea
                        id="message"
                        name="message"
                        value={messageForm.message}
                        onChange={handleMessageFormChange}
                        placeholder="Nhập tin nhắn..."
                        required
                        className="form-control message-textarea"
                        rows="3"
                      />
                      <input
                        type="hidden"
                        id="chatId"
                        name="chatId"
                        value={messageForm.chatId}
                      />
                      <button
                        type="submit"
                        className="send-btn"
                        disabled={sendingMessage || !botStatus || !messageForm.chatId || !messageForm.message}
                      >
                        {sendingMessage ? (
                          <FiRefreshCw className="spinning" />
                        ) : (
                          <FiSend />
                        )}
                      </button>
                    </form>
                    {!botStatus && (
                      <div className="send-warning">
                        <FiAlertCircle className="warning-icon" />
                        <span>Bot đang không hoạt động. Vui lòng khởi động bot trước khi gửi tin nhắn.</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="no-conversation">
                  <div className="no-conversation-content">
                    <FiMessageCircle className="no-conversation-icon" />
                    <h3>Chưa chọn cuộc hội thoại</h3>
                    <p>Chọn một khách hàng từ danh sách để xem tin nhắn và trả lời.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ShopConfig; 