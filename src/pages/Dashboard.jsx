import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';


import { 
  FiHome, FiUser, FiMessageSquare, FiClock, 
  FiSettings, FiLogOut, FiEdit, FiKey, 
  FiGrid, FiCheckCircle, FiFileText, FiAlertCircle, 
  FiRefreshCw, FiDollarSign, FiList, FiCopy,
  FiShield, FiInfo, FiActivity, FiCalendar, FiStar,
  FiCreditCard, FiBarChart2, FiX, FiAtSign, FiHash, 
  FiMail, FiPhone, FiMapPin, FiGlobe, FiBriefcase,
  FiShoppingBag, FiPlus, FiTrash2, FiEdit3, FiToggleLeft, FiToggleRight, FiPackage, FiLayout
} from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import '../assets/css/dashboard.css';
import profileService from '../services/profileService';
import paymentService from '../services/paymentService';
import shopService from '../services/shopService';
import balanceService from '../services/balanceService';
import Footer from '../layouts/Footer';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: ''
  });

  // State cho phần nạp tiền
  const [paymentAmount, setPaymentAmount] = useState(0.01);

  const [paymentInfo, setPaymentInfo] = useState(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentList, setPaymentList] = useState([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('crypto'); // 'crypto' hoặc 'vnpay'
  
  // State cho VNPAY
  const [vnpayAmount, setVnpayAmount] = useState(100000);
  const [vnpayBankCode, setVnpayBankCode] = useState('');
  const [isCreatingVnpayPayment, setIsCreatingVnpayPayment] = useState(false);
  const [vnpayTransactions, setVnpayTransactions] = useState([]);
  const [isLoadingVnpayTransactions, setIsLoadingVnpayTransactions] = useState(false);
  
  // State cho phần shop
  const [shops, setShops] = useState([]);
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [shopFormData, setShopFormData] = useState({
    name: ''
  });
  const [isCreatingShop, setIsCreatingShop] = useState(false);
  const [shopError, setShopError] = useState(null);
  const [editingShopId, setEditingShopId] = useState(null);
  const [shopFormVisible, setShopFormVisible] = useState(false);
  
  // Lấy từ URL state nếu có
  const location = useLocation();
  useEffect(() => {
    if (location.state?.activeSection) {
      setActiveSection(location.state.activeSection);
    }
  }, [location]);

  // Lấy danh sách shops với useCallback
  const fetchShops = useCallback(async () => {
    try {
      setIsLoadingShops(true);
      setShopError(null);
      const data = await shopService.getShops();
      setShops(data);
    } catch (err) {
      console.error('Error fetching shops:', err);
      setShopError('Không thể tải danh sách cửa hàng. Vui lòng thử lại sau.');
      // Nếu gặp lỗi về token, chuyển hướng đến trang login
      if (err.message && (err.message.includes('token') || err.response?.status === 401)) {
        logout(); // Đăng xuất người dùng
        navigate('/login');
        return;
      }
    } finally {
      setIsLoadingShops(false);
    }
  }, [logout, navigate]);

  // Lấy thông tin người dùng
  const fetchUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const profile = await profileService.getUserProfile();
      setProfile(profile);
      setBalance(profile.balance);
      
      // Tách fullname thành firstName và lastName
      const names = profile.fullname?.split(' ') || ['', ''];
      const lastName = names.pop() || '';
      const firstName = names.join(' ');
      
      setFormData({
        firstName,
        lastName
      });
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // Nếu gặp lỗi về token, chuyển hướng đến trang login
      if (err.message && (err.message.includes('token') || err.response?.status === 401)) {
        logout(); // Đăng xuất người dùng
        navigate('/login');
        return;
      }
      setError('Không thể tải thông tin người dùng. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, logout]);

  // Thêm useEffect để tải profile khi trang tải
  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    fetchUserProfile();
  }, [fetchUserProfile, isAuthenticated, navigate]);

  // Thêm useEffect riêng để tải shop khi chuyển tab
  useEffect(() => {
    if (activeSection === 'shop' && isAuthenticated()) {
      fetchShops();
    }
  }, [activeSection, isAuthenticated, fetchShops]);

  const refreshBalance = async () => {
    try {
      setIsRefreshing(true);
      const profileData = await profileService.getUserProfile();
      setProfile(profileData);
      setBalance(profileData.balance);
    } catch (err) {
      console.error('Error refreshing balance:', err);
      // Nếu gặp lỗi về token, chuyển hướng đến trang login
      if (err.message && (err.message.includes('token') || err.response?.status === 401)) {
        logout(); // Đăng xuất người dùng
        navigate('/login');
        return;
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Hàm tải danh sách thanh toán
  const fetchPayments = useCallback(async () => {
    try {
      setIsLoadingPayments(true);
      const payments = await paymentService.getUserPayments();
      setPaymentList(payments);
    } catch (err) {
      console.error('Error fetching payments:', err);
      // Nếu gặp lỗi về token, chuyển hướng đến trang login
      if (err.message && (err.message.includes('token') || err.response?.status === 401)) {
        logout(); // Đăng xuất người dùng
        navigate('/login');
        return;
      }
    } finally {
      setIsLoadingPayments(false);
    }
  }, [logout, navigate]);

  // Hàm tạo giao dịch
  const createPayment = async (e) => {
    e.preventDefault();
    try {
      setIsCreatingPayment(true);
      const payment = await paymentService.createPayment(paymentAmount, 'BNB');
      setPaymentInfo(payment);
      // Tự động cập nhật danh sách thanh toán
      fetchPayments();
    } catch (err) {
      console.error('Error creating payment:', err);
      // Nếu gặp lỗi về token, chuyển hướng đến trang login
      if (err.message && (err.message.includes('token') || err.response?.status === 401)) {
        logout(); // Đăng xuất người dùng
        navigate('/login');
        return;
      }
      setError('Không thể tạo yêu cầu thanh toán. Vui lòng thử lại sau.');
    } finally {
      setIsCreatingPayment(false);
    }
  };
  
  // Kiểm tra trạng thái thanh toán
  const checkPaymentStatus = async (paymentId) => {
    try {
      setIsCheckingPayment(true);
      const payment = await paymentService.checkPaymentStatus(paymentId);

      // Cập nhật số dư nếu thanh toán thành công
      if (payment.status === 'COMPLETED' || payment.status === 'PAID' || payment.status === 'SWEPT') {
        refreshBalance();
      }
    } catch (err) {
      console.error('Error checking payment status:', err);
      // Nếu gặp lỗi về token, chuyển hướng đến trang login
      if (err.message && (err.message.includes('token') || err.response?.status === 401)) {
        logout(); // Đăng xuất người dùng
        navigate('/login');
        return;
      }
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || ''
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      // Kết hợp firstName và lastName thành fullname
      const profileUpdateData = {
        fullname: `${formData.firstName} ${formData.lastName}`.trim()
      };
      const updatedProfile = await profileService.updateUserProfile(profileUpdateData);
      setProfile(updatedProfile);
      setBalance(updatedProfile.balance);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      // Nếu gặp lỗi về token, chuyển hướng đến trang login
      if (err.message && (err.message.includes('token') || err.response?.status === 401)) {
        logout(); // Đăng xuất người dùng
        navigate('/login');
        return;
      }
      setError('Không thể cập nhật thông tin. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tải danh sách thanh toán khi chuyển đến tab nạp tiền
  useEffect(() => {
    if (activeSection === 'deposit') {
      fetchPayments();
    }
  }, [activeSection, fetchPayments]);

  // Hàm tạo giao dịch VNPAY
  const createVnpayPayment = async (e) => {
    e.preventDefault();
    try {
      setIsCreatingVnpayPayment(true);
      const payment = await paymentService.createVnpayPayment(
        vnpayAmount,
        `Nạp ${vnpayAmount.toLocaleString()} VND vào tài khoản`,
        vnpayBankCode
      );
      
      // Chuyển hướng đến URL thanh toán VNPAY
      if (payment && payment.paymentUrl) {
        window.location.href = payment.paymentUrl;
      }
    } catch (err) {
      console.error('Error creating VNPAY payment:', err);
      setError('Không thể tạo yêu cầu thanh toán VNPAY. Vui lòng thử lại sau.');
    } finally {
      setIsCreatingVnpayPayment(false);
    }
  };

  // Lấy danh sách giao dịch VNPAY
  const fetchVnpayTransactions = async () => {
    try {
      setIsLoadingVnpayTransactions(true);
      const transactions = await paymentService.getVnpayTransactions();
      setVnpayTransactions(transactions);
    } catch (err) {
      console.error('Error fetching VNPAY transactions:', err);
    } finally {
      setIsLoadingVnpayTransactions(false);
    }
  };

  // Tải danh sách giao dịch VNPAY khi chọn phương thức thanh toán VNPAY
  useEffect(() => {
    if (activeSection === 'deposit' && paymentMethod === 'vnpay') {
      fetchVnpayTransactions();
    }
  }, [activeSection, paymentMethod]);

  const renderOverview = () => (
    <>
      <div className="page-title-container">
        <h2 className="dashboard-title"><FiHome className="title-icon" /> Tổng quan</h2>
      </div>
      <div className="overview-stats">
        <div className="stat-card account-card">
          <div className="stat-card-content">
            <div className="stat-card-header">
              <h3>Tài khoản</h3>
              <div className="stat-icon">
                <FiShield size={24} />
              </div>
            </div>
            <div className="stat-value">
              <span className={`status-indicator ${profile?.status === 'ACTIVE' ? 'active' : 'inactive'}`}></span>
              {profile?.status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
            </div>
            <p className="stat-desc">
              {profile?.status === 'ACTIVE'
                ? 'Tài khoản của bạn đang hoạt động bình thường' 
                : 'Tài khoản của bạn đang bị hạn chế'}
            </p>
          </div>
        </div>
        <div className="stat-card balance-card">
          <div className="stat-card-content">
            <div className="stat-card-header">
              <h3 className="balance-header">Số dư tài khoản</h3>
              <div className="stat-icon">
                <FiCreditCard size={24} />
              </div>
            </div>
            <div className="stat-value balance-value">
              {balance !== null 
                ? `${balance.toLocaleString()} VNĐ` 
                : 'Đang tải...'}
            </div>
            <p className="stat-desc">Số dư hiện tại trong tài khoản của bạn</p>
            <button 
              className="refresh-btn" 
              onClick={refreshBalance}
              disabled={isRefreshing}
            >
              <FiRefreshCw className={`refresh-icon ${isRefreshing ? 'spinning' : ''}`} />
              <span>{isRefreshing ? 'Đang cập nhật' : 'Cập nhật số dư'}</span>
            </button>
          </div>
        </div>
        <div className="stat-card user-card">
          <div className="stat-card-content">
            <div className="stat-card-header">
              <h3>Thông tin cá nhân</h3>
              <div className="stat-icon">
                <FiUser size={24} />
              </div>
            </div>
            <div className="stat-value">
              {profile?.fullname 
                ? profile.fullname
                : 'Chưa cập nhật'}
            </div>
            <p className="stat-desc">Tên hiển thị của bạn trên hệ thống</p>
            <button 
              className="view-profile-btn" 
              onClick={() => setActiveSection('profile')}
            >
              Xem hồ sơ <FiActivity size={16} />
            </button>
          </div>
        </div>
        {profile?.isAdmin && (
          <div className="stat-card admin-card">
            <div className="stat-card-content">
              <div className="stat-card-header">
                <h3>Quyền hạn</h3>
                <div className="stat-icon">
                  <FiKey size={24} />
                </div>
              </div>
              <div className="stat-value">
                Quản trị viên
              </div>
              <p className="stat-desc">Bạn có quyền quản trị hệ thống</p>
            </div>
          </div>
        )}
      </div>

      <div className="quick-actions">
        <div className="section-header">
          <h3><FiList size={18} /> Thao tác nhanh</h3>
        </div>
        <div className="actions-container">
          <button 
            className="action-btn edit-profile-action" 
            onClick={() => setActiveSection('profile')}
          >
            <div className="action-icon-wrapper">
              <FiEdit className="action-icon" />
            </div>
            <span>Chỉnh sửa hồ sơ</span>
          </button>
          <button 
            className="action-btn deposit-action"
            onClick={() => setActiveSection('deposit')}
          >
            <div className="action-icon-wrapper">
              <FiDollarSign className="action-icon" />
            </div>
            <span>Nạp tiền</span>
          </button>
          <button 
            className="action-btn assistant-action"
            onClick={() => setActiveSection('assistant')}
          >
            <div className="action-icon-wrapper">
              <FiMessageSquare className="action-icon" />
            </div>
            <span>Trò chuyện với Trợ lý</span>
          </button>
        </div>
      </div>

      <div className="recent-activities">
        <div className="section-header">
          <h3><FiBarChart2 size={18} /> Hoạt động gần đây</h3>
        </div>
        <div className="activity-list">
          <p className="no-activities">Không có hoạt động gần đây</p>
        </div>
      </div>
    </>
  );

  const renderProfile = () => (
    <>
      <div className="page-title-container">
        <h2 className="dashboard-title"><FiUser className="title-icon" /> Thông tin cá nhân</h2>
      </div>
      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-avatar-container">
            {profile?.avatar ? (
              <img src={profile.avatar} alt="User avatar" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-default">{getInitials(profile?.fullname || profile?.username)}</div>
            )}
            {!isEditing && (
              <button className="avatar-edit-btn" onClick={handleEditProfile}>
                <FiEdit size={16} />
              </button>
            )}
          </div>
          <h2 className="profile-name">{profile?.fullname || profile?.username || 'User'}</h2>
          <p className="profile-username">{profile?.username || 'email@example.com'}</p>
          
          {profile?.status && (
            <div className={`profile-status ${profile.status.toLowerCase()}`}>
              <span className="status-dot"></span>
              {profile.status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
            </div>
          )}
          
          {profile?.balance !== undefined && (
            <div className="profile-balance-container">
              <div className="balance-label">Số dư tài khoản</div>
              <div className="balance-amount">{profile.balance.toLocaleString()} VNĐ</div>
              <button className="balance-refresh" onClick={refreshBalance}>
                <FiRefreshCw className={isRefreshing ? 'spinning' : ''} />
                {isRefreshing ? 'Đang cập nhật...' : 'Cập nhật số dư'}
              </button>
            </div>
          )}
        </div>

        <div className="profile-content">
          {!isEditing ? (
            <>
              <div className="profile-section">
                <div className="section-header">
                  <h3><FiInfo size={18} /> Thông tin cơ bản</h3>
                </div>
                <div className="profile-card">
                  <div className="info-group">
                    <div className="info-label">
                      <FiUser size={16} className="info-icon" /> Họ và tên
                    </div>
                    <div className="info-value">{profile?.fullname || 'Chưa cập nhật'}</div>
                  </div>
                  <div className="info-group">
                    <div className="info-label">
                      <FiAtSign size={16} className="info-icon" /> Tên đăng nhập
                    </div>
                    <div className="info-value">{profile?.username || 'Chưa cập nhật'}</div>
                  </div>
                  <div className="info-group">
                    <div className="info-label">
                      <FiCalendar size={16} className="info-icon" /> Ngày sinh
                    </div>
                    <div className="info-value">{profile?.birthdate || 'Chưa cập nhật'}</div>
                  </div>
                  <div className="info-group">
                    <div className="info-label">
                      <FiHash size={16} className="info-icon" /> ID tài khoản
                    </div>
                    <div className="info-value id-value">{profile?.id || 'Không xác định'}</div>
                  </div>
                </div>
              </div>
              
              <div className="profile-section">
                <div className="section-header">
                  <h3><FiMail size={18} /> Thông tin liên hệ</h3>
                </div>
                <div className="profile-card">
                  <div className="info-group">
                    <div className="info-label">
                      <FiMail size={16} className="info-icon icon-mail" /> Email
                    </div>
                    <div className="info-value">{profile?.email || 'Chưa cập nhật'}</div>
                  </div>
                  <div className="info-group">
                    <div className="info-label">
                      <FiPhone size={16} className="info-icon icon-phone" /> Số điện thoại
                    </div>
                    <div className="info-value">{profile?.phone || 'Chưa cập nhật'}</div>
                  </div>
                  <div className="info-group">
                    <div className="info-label">
                      <FiMapPin size={16} className="info-icon icon-map" /> Địa chỉ
                    </div>
                    <div className="info-value">{profile?.address || 'Chưa cập nhật'}</div>
                  </div>
                </div>
              </div>

              <div className="profile-actions-container">
                <button className="profile-action-btn edit-btn" onClick={handleEditProfile}>
                  <FiEdit className="btn-icon" /> Chỉnh sửa thông tin
                </button>
                <button className="profile-action-btn deposit-btn" onClick={() => setActiveSection('deposit')}>
                  <FiDollarSign className="btn-icon" /> Nạp tiền
                </button>
              </div>
            </>
          ) : (
            <div className="profile-section">
              <div className="section-header">
                <h3><FiEdit size={18} /> Chỉnh sửa thông tin</h3>
              </div>
              <div className="profile-card">
                <form onSubmit={handleUpdateProfile} className="edit-profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label><FiUser size={16} className="form-icon" /> Họ</label>
                      <input 
                        type="text" 
                        name="lastName" 
                        value={formData.lastName} 
                        onChange={handleFormChange}
                        placeholder="Nhập họ của bạn"
                      />
                    </div>
                    <div className="form-group">
                      <label><FiUser size={16} className="form-icon" /> Tên</label>
                      <input 
                        type="text" 
                        name="firstName" 
                        value={formData.firstName} 
                        onChange={handleFormChange}
                        placeholder="Nhập tên của bạn"
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="save-btn">
                      <FiCheckCircle size={16} /> Lưu thay đổi
                    </button>
                    <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
                      <FiX size={16} /> Hủy
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const renderAssistant = () => (
    <>
      <div className="page-title-container">
        <h2 className="dashboard-title"><FiMessageSquare className="title-icon" /> AI Assistant</h2>
      </div>
      
      <div className="assistant-intro">
        <h2>Your Personal AI Assistant</h2>
        <p>Get help with your questions, tasks, and more. Our AI assistant is here to help you 24/7.</p>
        <Link to="#" className="start-chat-btn">Start a New Conversation</Link>
      </div>
      
      <div className="assistant-features">
        <h3>Features</h3>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <FiMessageSquare />
            </div>
            <h4>Smart Conversations</h4>
            <p>Natural language understanding for smooth conversations.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <FiFileText />
            </div>
            <h4>Document Assistance</h4>
            <p>Get help with formatting and reviewing documents.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <FiGrid />
            </div>
            <h4>Task Management</h4>
            <p>Create and track tasks with voice commands.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <FiCheckCircle />
            </div>
            <h4>Quick Answers</h4>
            <p>Get immediate responses to your questions.</p>
          </div>
        </div>
      </div>
      
      <div className="suggested-prompts">
        <h3>Suggested Prompts</h3>
        <div className="prompt-list">
          <button className="prompt-btn">How do I update my account settings?</button>
          <button className="prompt-btn">Can you help me with password recovery?</button>
          <button className="prompt-btn">What are the benefits of verifying my email?</button>
          <button className="prompt-btn">Tell me about account security best practices</button>
        </div>
      </div>
    </>
  );

  const renderHistory = () => (
    <>
      <div className="history-header">
        <div className="page-title-container">
          <h2 className="dashboard-title"><FiClock className="title-icon" /> Conversation History</h2>
        </div>
        <div className="history-search">
          <input type="text" placeholder="Search conversations..." />
          <button className="search-btn">Search</button>
        </div>
      </div>
      
      <div className="history-filters">
        <select className="filter-dropdown">
          <option value="all">All Conversations</option>
          <option value="recent">Recent (Last 7 days)</option>
          <option value="month">This Month</option>
          <option value="older">Older</option>
        </select>
        
        <button className="clear-history-btn">Clear History</button>
      </div>
      
      <div className="conversation-list">
        <p className="no-conversations">No conversation history to display</p>
      </div>
    </>
  );

  const renderSettings = () => (
    <>
      <div className="page-title-container">
        <h2 className="dashboard-title"><FiSettings className="title-icon" /> Settings</h2>
      </div>
      
      <div className="settings-card">
        <h3>Account Settings</h3>
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-name">Email Notifications</div>
            <div className="setting-desc">Receive email notifications for account activities</div>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" defaultChecked />
            <span className="toggle-slider"></span>
          </label>
        </div>
        
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-name">Two-Factor Authentication</div>
            <div className="setting-desc">Add an extra layer of security to your account</div>
          </div>
          <button className="setting-action-btn">Enable</button>
        </div>
        
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-name">Session Management</div>
            <div className="setting-desc">Manage active sessions and devices</div>
          </div>
          <button className="setting-action-btn">View</button>
        </div>
      </div>
      
      <div className="settings-card">
        <h3>Privacy Settings</h3>
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-name">Data Collection</div>
            <div className="setting-desc">Allow us to collect usage data to improve services</div>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" defaultChecked />
            <span className="toggle-slider"></span>
          </label>
        </div>
        
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-name">Personalized Recommendations</div>
            <div className="setting-desc">Receive personalized content based on your activity</div>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" defaultChecked />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      <div className="settings-card danger-zone">
        <h3>Danger Zone</h3>
        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-name">Delete Account</div>
            <div className="setting-desc">Permanently delete your account and all data</div>
          </div>
          <button className="delete-account-btn">Delete</button>
        </div>
      </div>
    </>
  );

  const renderDeposit = () => {
    // Nếu đang tải thông tin thanh toán
    if (isCreatingPayment) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tạo yêu cầu thanh toán...</p>
        </div>
      );
    }

    // Nếu đã có thông tin thanh toán
    if (paymentInfo) {
      return (
        <div className="deposit-section">
          <div className="page-title-container">
            <h2 className="dashboard-title"><FiDollarSign className="title-icon" /> Nạp tiền vào tài khoản</h2>
          </div>
          
          <div className="payment-methods">
            <div className="payment-method-tabs">
              <button 
                className={`payment-method-tab ${paymentMethod === 'crypto' ? 'active' : ''}`}
                onClick={() => {
                  setPaymentMethod('crypto');
                  setPaymentInfo(null);
                }}
              >
                <FiDollarSign className="tab-icon" /> Crypto (BNB)
              </button>
              <button 
                className={`payment-method-tab ${paymentMethod === 'vnpay' ? 'active' : ''}`}
                onClick={() => {
                  setPaymentMethod('vnpay');
                  setPaymentInfo(null);
                }}
              >
                <FiCreditCard className="tab-icon" /> VNPAY
              </button>
            </div>
          </div>
          
          <div className="payment-info">
            <div className="payment-status">
              <h3>Yêu cầu thanh toán đã được tạo</h3>
              <div className={`status-badge payment-status-${paymentInfo.status.toLowerCase()}`}>
                {paymentInfo.status === 'PENDING' ? 'Đang chờ thanh toán' : 
                 paymentInfo.status === 'COMPLETED' || paymentInfo.status === 'PAID' || paymentInfo.status === 'SWEPT' ? 'Đã hoàn thành' :
                 paymentInfo.status === 'FAILED' ? 'Thất bại' : 'Đã hết hạn'}
              </div>
            </div>
            
            <div className="payment-qr-container">
              <div className="payment-details">
                <div className="detail-row">
                  <div className="detail-label">Mã giao dịch:</div>
                  <div className="detail-value">{paymentInfo.id}</div>
                </div>
                {paymentInfo.expectedAmount && (
                  <div className="detail-row">
                    <div className="detail-label">Số tiền:</div>
                    <div className="detail-value">{paymentInfo.expectedAmount} BNB (≈ {paymentInfo.expectedAmountVnd.toLocaleString()} VNĐ)</div>
                  </div>
                )}
                {paymentInfo.currentBnbPriceUsd && (
                  <div className="detail-row">
                    <div className="detail-label">Tỷ giá hiện tại:</div>
                    <div className="detail-value">1 BNB = {paymentInfo.currentBnbPriceUsd.toLocaleString()} USD</div>
                  </div>
                )}
                {paymentInfo.walletAddress && (
                  <div className="detail-row">
                    <div className="detail-label">Địa chỉ thanh toán:</div>
                    <div className="detail-value address-value">
                      <span className="payment-address">{paymentInfo.walletAddress}</span>
                      <button 
                        className="copy-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(paymentInfo.walletAddress);
                          alert('Đã sao chép địa chỉ ví');
                        }}
                      >
                        <FiCopy /> Sao chép
                      </button>
                    </div>
                  </div>
                )}
                <div className="detail-row">
                  <div className="detail-label">Thời gian tạo:</div>
                  <div className="detail-value">
                    {paymentInfo.createdAt ? new Date(paymentInfo.createdAt).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Thời gian hết hạn:</div>
                  <div className="detail-value">
                    {paymentInfo.expiresAt ? new Date(paymentInfo.expiresAt).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </div>
              
              {paymentInfo.walletAddress && (
                <div className="qr-code-container">
                  <QRCodeSVG 
                    value={`bnb:${paymentInfo.walletAddress}?value=${paymentInfo.expectedAmount}`}
                    size={180}
                    includeMargin={true}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                    level={"L"}
                    className="payment-qr-code"
                  />
                  <p className="qr-code-caption">Quét mã QR để thanh toán</p>
                  <p className="qr-code-subcaption">Tương thích với MetaMask, Trust Wallet, OKX Wallet</p>
                </div>
              )}
            </div>
            
            <div className="payment-instructions">
              <h4>Hướng dẫn thanh toán:</h4>
              <ol>
                <li>Quét mã QR bằng ứng dụng ví điện tử hoặc sao chép địa chỉ</li>
                <li>Mở ví Web3 của bạn (MetaMask, Trust Wallet, OKX Web3)</li>
                <li>Chuyển <strong>{paymentInfo.expectedAmount} BNB</strong> đến địa chỉ được cung cấp</li>
                <li>Chờ giao dịch được xác nhận trên blockchain</li>
                <li>Hệ thống sẽ tự động cập nhật số dư của bạn</li>
              </ol>
            </div>
            
            {paymentInfo.paymentInstructions && (
              <div className="payment-system-instructions">
                <h4>Thông tin từ hệ thống:</h4>
                <div className="system-instruction-box">
                  {paymentInfo.paymentInstructions}
                </div>
              </div>
            )}
            
            <div className="payment-actions">
              <button 
                className="check-status-btn"
                onClick={() => checkPaymentStatus(paymentInfo.id)}
                disabled={isCheckingPayment}
              >
                {isCheckingPayment ? 
                  <><FiRefreshCw className="spinning" /> Đang kiểm tra...</> : 
                  'Kiểm tra trạng thái'}
              </button>
              <button 
                className="new-payment-btn"
                onClick={() => setPaymentInfo(null)}
              >
                Tạo yêu cầu mới
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Form tạo yêu cầu thanh toán mới
    return (
      <div className="deposit-section">
        <div className="page-title-container">
          <h2 className="dashboard-title"><FiDollarSign className="title-icon" /> Nạp tiền vào tài khoản</h2>
        </div>
        
        <div className="payment-methods">
          <div className="payment-method-tabs">
            <button 
              className={`payment-method-tab ${paymentMethod === 'crypto' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('crypto')}
            >
              <FiDollarSign className="tab-icon" /> Crypto (BNB)
            </button>
            <button 
              className={`payment-method-tab ${paymentMethod === 'vnpay' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('vnpay')}
            >
              <FiCreditCard className="tab-icon" /> VNPAY
            </button>
          </div>
        </div>
        
        {paymentMethod === 'crypto' ? (
          <div className="deposit-container">
            <div className="deposit-info">
              <h3>Nạp BNB vào tài khoản</h3>
              <p>Hãy nhập số tiền BNB bạn muốn nạp vào tài khoản</p>
              
              <form className="deposit-form" onSubmit={createPayment}>
                <div className="form-group">
                  <label>Số tiền (BNB):</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="deposit-input"
                    required
                  />
                </div>
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="create-payment-btn"
                    disabled={isCreatingPayment}
                  >
                    Tạo yêu cầu nạp tiền
                  </button>
                </div>
              </form>
            </div>
            
            <div className="deposit-instructions">
              <h3>Hướng dẫn nạp tiền</h3>
              <ol>
                <li>Nhập số lượng BNB muốn nạp (tối thiểu 0.01 BNB)</li>
                <li>Nhấn "Tạo yêu cầu nạp tiền" để nhận địa chỉ thanh toán</li>
                <li>Sử dụng ví Web3 (MetaMask, Trust Wallet) chuyển BNB đến địa chỉ được cung cấp</li>
                <li>Chờ giao dịch được xác nhận trên blockchain (15-60 giây)</li>
                <li>Số dư tài khoản sẽ được tự động cập nhật khi giao dịch thành công</li>
              </ol>
              <div className="note">
                <strong>Lưu ý:</strong> Giao dịch trên blockchain không thể hoàn tác. Vui lòng kiểm tra kỹ thông tin trước khi thực hiện.
              </div>
            </div>
          </div>
        ) : (
          <div className="deposit-container vnpay-container">
            <div className="deposit-info">
              <h3>Nạp tiền qua VNPAY</h3>
              <p>Thanh toán nhanh chóng qua cổng VNPAY với hơn 40 ngân hàng</p>
              
              <form className="deposit-form" onSubmit={createVnpayPayment}>
                <div className="form-group">
                  <label>Số tiền (VND):</label>
                  <input 
                    type="number"
                    min="10000"
                    step="10000"
                    value={vnpayAmount}
                    onChange={(e) => setVnpayAmount(Number(e.target.value))}
                    className="deposit-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Ngân hàng (tùy chọn):</label>
                  <select
                    value={vnpayBankCode}
                    onChange={(e) => setVnpayBankCode(e.target.value)}
                    className="deposit-input"
                  >
                    <option value="">-- Chọn ngân hàng --</option>
                    <option value="NCB">NCB - Ngân hàng Quốc Dân</option>
                    <option value="VIETCOMBANK">Vietcombank - Ngân hàng TMCP Ngoại Thương</option>
                    <option value="VIETINBANK">Vietinbank - Ngân hàng TMCP Công Thương</option>
                    <option value="BIDV">BIDV - Ngân hàng TMCP Đầu tư và Phát triển Việt Nam</option>
                    <option value="AGRIBANK">Agribank - Ngân hàng Nông nghiệp</option>
                    <option value="TECHCOMBANK">Techcombank - Ngân hàng Kỹ thương</option>
                    <option value="MBBANK">MBBank - Ngân hàng Quân đội</option>
                    <option value="SACOMBANK">Sacombank - Ngân hàng TMCP Sài Gòn Thương Tín</option>
                    <option value="VPBANK">VPBank - Ngân hàng Việt Nam Thịnh Vượng</option>
                    <option value="TPB">TPBank - Ngân hàng Tiên Phong</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="create-payment-btn"
                    disabled={isCreatingVnpayPayment}
                  >
                    {isCreatingVnpayPayment ? (
                      <><FiRefreshCw className="spinning" /> Đang xử lý...</>
                    ) : (
                      'Thanh toán qua VNPAY'
                    )}
                  </button>
                </div>
              </form>
            </div>
            
            <div className="deposit-instructions">
              <h3>Hướng dẫn thanh toán qua VNPAY</h3>
              <ol>
                <li>Nhập số tiền muốn nạp (tối thiểu 10,000 VND)</li>
                <li>Chọn ngân hàng (không bắt buộc)</li>
                <li>Nhấn "Thanh toán qua VNPAY" để chuyển đến cổng thanh toán</li>
                <li>Thực hiện thanh toán theo hướng dẫn trên cổng VNPAY</li>
                <li>Sau khi thanh toán thành công, bạn sẽ được chuyển về trang kết quả</li>
                <li>Số dư tài khoản sẽ được cập nhật tự động sau khi thanh toán thành công</li>
              </ol>
              <div className="vnpay-logo">
                {/* VNPAY QR */}
                <img src="https://stcd02206177151.cloud.edgevnpay.vn/assets/images/business/vnpay-qr.png" alt="VNPAY QR" className="vnpay-icon" height="32" />
                
                {/* VISA */}
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Visa_2014.svg/1920px-Visa_2014.svg.png" alt="VISA" className="payment-card-icon" height="32" />
                
                {/* Mastercard */}
                <img src="https://www.mastercard.com/content/dam/public/mastercardcom/vn/vi/logos/mastercard-og-image.png" alt="Mastercard" className="payment-card-icon" height="32" />
                
                {/* JCB */}
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSgber4MngQY983WF6ItDL0bzmmImENuVrPw&s" alt="JCB" className="payment-card-icon" height="32" />
              </div>
              <div className="note">
                <strong>Lưu ý:</strong> Vui lòng không tắt trình duyệt trong quá trình thanh toán.
              </div>
            </div>
          </div>
        )}
        
        <div className="payment-history">
          <div className="history-header">
            <h3>Lịch sử giao dịch</h3>
            <button 
              className="refresh-btn" 
              onClick={paymentMethod === 'vnpay' ? fetchVnpayTransactions : fetchPayments}
            >
              <FiRefreshCw className={isLoadingPayments || isLoadingVnpayTransactions ? 'spinning' : ''} />
              {isLoadingPayments || isLoadingVnpayTransactions ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
          
          {paymentMethod === 'vnpay' ? (
            vnpayTransactions && vnpayTransactions.length > 0 ? (
              <div className="payment-list">
                <table className="payment-table">
                  <thead>
                    <tr>
                      <th>Mã đơn hàng</th>
                      <th>Số tiền</th>
                      <th>Trạng thái</th>
                      <th>Ngày tạo</th>
                      <th>Ngân hàng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vnpayTransactions.map(transaction => (
                      <tr key={transaction.id}>
                        <td>{transaction.orderId}</td>
                        <td>{transaction.amount.toLocaleString()} VND</td>
                        <td>
                          <span className={`status-badge payment-status-${transaction.status.toLowerCase()}`}>
                            {transaction.status === 'COMPLETED' ? 'Hoàn thành' : 
                             transaction.status === 'PENDING' ? 'Đang chờ' : 
                             transaction.status === 'FAILED' ? 'Thất bại' : 'Hết hạn'}
                          </span>
                        </td>
                        <td>{new Date(transaction.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td>{transaction.bankCode || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-payments">
                <p>Bạn chưa có giao dịch VNPAY nào</p>
              </div>
            )
          ) : (
            paymentList && paymentList.length > 0 ? (
              <div className="payment-list">
                <table className="payment-table">
                  <thead>
                    <tr>
                      <th>Mã giao dịch</th>
                      <th>Số tiền</th>
                      <th>Trạng thái</th>
                      <th>Ngày tạo</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentList.map(payment => (
                      <tr key={payment.id}>
                        <td>{payment.id}</td>
                        <td>{payment.expectedAmount} BNB (≈ {payment.expectedAmountVnd.toLocaleString()} VNĐ)</td>
                        <td>
                          <span className={`status-badge payment-status-${payment.status.toLowerCase()}`}>
                            {payment.status === 'PENDING' ? 'Đang chờ' : 
                             payment.status === 'COMPLETED' || payment.status === 'PAID' || payment.status === 'SWEPT' ? 'Hoàn thành' :
                             payment.status === 'FAILED' ? 'Thất bại' : 'Hết hạn'}
                          </span>
                        </td>
                        <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button 
                            className="detail-btn"
                            onClick={() => {
                              setPaymentInfo(payment);
                              window.scrollTo(0, 0);
                            }}
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-payments">
                <p>Bạn chưa có giao dịch nào</p>
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  const renderShops = () => (
    <>
      <div className="page-title-container">
        <h2 className="dashboard-title"><FiShoppingBag className="title-icon" /> Quản lý cửa hàng</h2>
      </div>
      <div className="shop-container">
        {shopError && (
          <div className="error-alert">
            <FiAlertCircle className="error-icon" />
            <span>{shopError}</span>
            <button className="close-alert" onClick={() => setShopError(null)}>
              <FiX />
            </button>
          </div>
        )}
        
        <div className="shop-header">
          <h3>Danh sách cửa hàng của bạn</h3>
          <button className="add-shop-btn" onClick={() => {
            setShopFormData({ name: '' });
            setEditingShopId(null);
            setShopFormVisible(true);
          }}>
            <FiPlus />
            <span>Thêm cửa hàng</span>
          </button>
        </div>
        
        {shopFormVisible && (
          <div className="shop-form-container">
            <form onSubmit={editingShopId ? updateShop : createShop} className="shop-form">
              <h3>{editingShopId ? 'Cập nhật cửa hàng' : 'Tạo cửa hàng mới'}</h3>
              
              {!editingShopId && (
                <div className="payment-info-section">
                  <div className="payment-notice">
                    <FiDollarSign className="payment-icon" />
                    <div className="payment-details">
                      <h4>Chi phí tạo cửa hàng</h4>
                      <p className="payment-amount">520,000 VNĐ</p>
                      <p className="payment-description">
                        Số tiền sẽ được trừ từ số dư tài khoản của bạn.
                        {balance !== null && (
                          <span className={balance >= 520000 ? 'balance-sufficient' : 'balance-insufficient'}>
                            <br />Số dư hiện tại: {balance.toLocaleString()} VNĐ
                            {balance < 520000 && ' (Không đủ số dư)'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="shopName">Tên cửa hàng</label>
                <input
                  type="text"
                  id="shopName"
                  value={shopFormData.name}
                  onChange={(e) => setShopFormData({ ...shopFormData, name: e.target.value })}
                  placeholder="Nhập tên cửa hàng"
                  required
                />
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShopFormVisible(false);
                    setShopFormData({ name: '' });
                    setEditingShopId(null);
                  }}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isCreatingShop || (!editingShopId && balance !== null && balance < 520000)}
                >
                  {isCreatingShop ? (
                    <span className="loading-spinner small"></span>
                  ) : (
                    <>{editingShopId ? 'Cập nhật' : 'Tạo cửa hàng'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {isLoadingShops ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Đang tải danh sách cửa hàng...</p>
          </div>
        ) : shops.length === 0 ? (
          <div className="empty-shop-list">
            <div className="empty-icon-container">
              <FiShoppingBag className="empty-icon" />
            </div>
            <p>Bạn chưa có cửa hàng nào</p>
            <button 
              className="create-first-shop-btn"
              onClick={() => {
                setShopFormData({ name: '' });
                setEditingShopId(null);
                setShopFormVisible(true);
              }}
            >
              <FiPlus className="btn-icon" />
              <span>Tạo cửa hàng đầu tiên</span>
            </button>
          </div>
        ) : (
          <div className="shop-list">
            {shops.map(shop => (
              <div key={shop.id} className={`shop-card ${shop.status.toLowerCase()}`}>
                <div className="shop-card-content">
                  <div className="shop-header">
                    <div className="shop-name">
                      <a 
                        href={`/shop/${shop.id}/config`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="shop-link"
                      >
                        {shop.name}
                      </a>
                    </div>
                    <div className={`shop-status ${shop.status.toLowerCase()}`}>
                      <span className="status-dot"></span>
                      {shop.status === 'ACTIVE' ? 'Hoạt động' : 
                      shop.status === 'INACTIVE' ? 'Không hoạt động' : 'Đã tạm ngưng'}
                    </div>
                  </div>
                  <div className="shop-id">
                    <span className="id-label">ID:</span>
                    <span className="id-value">{shop.id}</span>
                  </div>
                </div>
                
                <button 
                  className="shop-management-btn"
                  onClick={() => navigate(`/shop/${shop.id}/management`)}
                >
                  <FiLayout className="btn-icon" />
                  <span>Quản lý cửa hàng</span>
                </button>
                
                <div className="shop-secondary-actions">
                  <button 
                    className="shop-action-btn icon-only configure-btn"
                    onClick={() => window.open(`/shop/${shop.id}/config`, '_blank')}
                    title="Cấu hình"
                  >
                    <FiSettings />
                  </button>
                  
                  <button 
                    className="shop-action-btn icon-only status-btn"
                    onClick={() => updateShopStatus(shop.id, shop.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                    title={shop.status === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                  >
                    {shop.status === 'ACTIVE' ? <FiToggleRight /> : <FiToggleLeft />}
                  </button>
                  
                  <button 
                    className="shop-action-btn icon-only delete-btn"
                    onClick={() => deleteShop(shop.id)}
                    title="Xóa"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="dashboard-container">
          <div className="error-message">
            <h2>Đã xảy ra lỗi</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Thử lại</button>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case 'profile':
        return renderProfile();
      case 'assistant':
        return renderAssistant();
      case 'history':
        return renderHistory();
      case 'settings':
        return renderSettings();
      case 'deposit':
        return renderDeposit();
      case 'shop':
        return renderShops();
      default:
        return renderOverview();
    }
  };

  // Tạo shop mới với useCallback
  const createShop = useCallback(async (e) => {
    e.preventDefault();
    if (!shopFormData.name.trim()) {
      setShopError('Vui lòng nhập tên cửa hàng');
      return;
    }
    
    try {
      setIsCreatingShop(true);
      setShopError(null);
      
      // Bước 1: Trừ tiền trước khi tạo shop (520,000 VND)
      try {
        const paymentResult = await balanceService.deductFixedAmount();
        
        if (!paymentResult || paymentResult !== true) {
          setShopError('Số dư không đủ để tạo cửa hàng. Vui lòng nạp thêm tiền vào tài khoản. Chi phí tạo cửa hàng: 520,000 VNĐ');
          return;
        }
      } catch (paymentError) {
        console.error('Error deducting payment:', paymentError);
        if (paymentError.response?.status === 400) {
          setShopError('Số dư không đủ để tạo cửa hàng. Vui lòng nạp thêm tiền vào tài khoản. Chi phí tạo cửa hàng: 520,000 VNĐ');
        } else {
          setShopError('Lỗi thanh toán. Vui lòng thử lại sau.');
        }
        return;
      }
      
      // Bước 2: Tạo shop sau khi thanh toán thành công
      try {
        await shopService.createShop(shopFormData.name);
        
        // Reset form và tải lại danh sách shop
        setShopFormData({ name: '' });
        setShopFormVisible(false);
        fetchShops();
        
        // Cập nhật số dư sau khi tạo shop thành công
        refreshBalance();
        
      } catch (shopError) {
        console.error('Error creating shop after payment:', shopError);
        setShopError('Đã thanh toán nhưng không thể tạo cửa hàng. Vui lòng liên hệ hỗ trợ để được hoàn tiền.');
        
        // Nếu gặp lỗi về token, chuyển hướng đến trang login
        if (shopError.message && (shopError.message.includes('token') || shopError.response?.status === 401)) {
          logout();
          navigate('/login');
          return;
        }
      }
      
    } catch (err) {
      console.error('Error in createShop:', err);
      setShopError('Không thể tạo cửa hàng. Vui lòng thử lại sau.');
      // Nếu gặp lỗi về token, chuyển hướng đến trang login
      if (err.message && (err.message.includes('token') || err.response?.status === 401)) {
        logout();
        navigate('/login');
        return;
      }
    } finally {
      setIsCreatingShop(false);
    }
  }, [shopFormData.name, fetchShops, refreshBalance, logout, navigate]);
  
  // Cập nhật shop với useCallback
  const updateShop = useCallback(async (e) => {
    e.preventDefault();
    if (!shopFormData.name.trim()) {
      setShopError('Vui lòng nhập tên cửa hàng');
      return;
    }
    
    try {
      setIsCreatingShop(true);
      setShopError(null);
      await shopService.updateShop(editingShopId, shopFormData.name);
      // Reset form và tải lại danh sách shop
      setShopFormData({ name: '' });
      setEditingShopId(null);
      setShopFormVisible(false);
      fetchShops();
    } catch (err) {
      console.error('Error updating shop:', err);
      setShopError('Không thể cập nhật cửa hàng. Vui lòng thử lại sau.');
      // Nếu gặp lỗi về token, chuyển hướng đến trang login
      if (err.message && (err.message.includes('token') || err.response?.status === 401)) {
        logout(); // Đăng xuất người dùng
        navigate('/login');
        return;
      }
    } finally {
      setIsCreatingShop(false);
    }
  }, [editingShopId, shopFormData.name, fetchShops, logout, navigate]);
  
  // Cập nhật trạng thái shop với useCallback
  const updateShopStatus = useCallback(async (shopId, newStatus) => {
    try {
      setShopError(null);
      await shopService.updateShopStatus(shopId, newStatus);
      // Tải lại danh sách shop
      fetchShops();
    } catch (err) {
      console.error('Error updating shop status:', err);
      setShopError('Không thể cập nhật trạng thái cửa hàng. Vui lòng thử lại sau.');
      // Nếu gặp lỗi về token, chuyển hướng đến trang login
      if (err.message && (err.message.includes('token') || err.response?.status === 401)) {
        logout(); // Đăng xuất người dùng
        navigate('/login');
        return;
      }
    }
  }, [fetchShops, logout, navigate]);
  
  // Xóa shop với useCallback
  const deleteShop = useCallback(async (shopId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa cửa hàng này?')) {
      return;
    }
    
    try {
      setShopError(null);
      await shopService.deleteShop(shopId);
      // Tải lại danh sách shop
      fetchShops();
    } catch (err) {
      console.error('Error deleting shop:', err);
      setShopError('Không thể xóa cửa hàng. Vui lòng thử lại sau.');
      // Nếu gặp lỗi về token, chuyển hướng đến trang login
      if (err.message && (err.message.includes('token') || err.response?.status === 401)) {
        logout(); // Đăng xuất người dùng
        navigate('/login');
        return;
      }
    }
  }, [fetchShops, logout, navigate]);
  


  return (
    <div className="dashboard-container">
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="dashboard-logo">
            <div className="dashboard-logo-icon">AI</div>
            <div className="dashboard-logo-text">Assistant</div>
          </div>
        </div>
        
        <div className="sidebar-menu">
          <div 
            className={`sidebar-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
          >
            <FiHome className="sidebar-icon" />
            <span>Tổng quan</span>
          </div>
          
          <div 
            className={`sidebar-item ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSection('profile')}
          >
            <FiUser className="sidebar-icon" />
            <span>Hồ sơ</span>
          </div>
          
          <div 
            className={`sidebar-item ${activeSection === 'deposit' ? 'active' : ''}`}
            onClick={() => setActiveSection('deposit')}
          >
            <FiDollarSign className="sidebar-icon" />
            <span>Nạp tiền</span>
          </div>
          
          <div 
            className={`sidebar-item ${activeSection === 'shop' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('shop');
              fetchShops();
            }}
          >
            <FiShoppingBag className="sidebar-icon" />
            <span>Cửa hàng</span>
          </div>
          
          <div 
            className={`sidebar-item ${activeSection === 'assistant' ? 'active' : ''}`}
            onClick={() => setActiveSection('assistant')}
          >
            <FiMessageSquare className="sidebar-icon" />
            <span>Trợ lý AI</span>
          </div>
          
          <div 
            className={`sidebar-item ${activeSection === 'history' ? 'active' : ''}`}
            onClick={() => setActiveSection('history')}
          >
            <FiClock className="sidebar-icon" />
            <span>Lịch sử</span>
          </div>
          
          <div 
            className={`sidebar-item ${activeSection === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveSection('settings')}
          >
            <FiSettings className="sidebar-icon" />
            <span>Cài đặt</span>
          </div>
        </div>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <FiLogOut className="sidebar-icon" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="dashboard-title">{isLoading ? 'Loading...' : activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</div>
          <div className="user-profile">
            <div className="user-greeting">
              Xin chào, {profile?.fullname?.split(' ')[0] || user?.name?.split(' ')[0] || 'User'}!
            </div>
            <div className="avatar-container">
              {user?.avatar ? (
                <img src={user.avatar} alt="User avatar" className="user-avatar" />
              ) : (
                <div className="default-avatar">{getInitials(profile?.fullname || user?.name)}</div>
              )}
            </div>
          </div>
        </div>
        
        <div className="dashboard-main">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 