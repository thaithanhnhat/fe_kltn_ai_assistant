import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiArrowLeft, FiShoppingBag, FiUsers, FiShoppingCart, FiMessageSquare, 
  FiPackage, FiSettings, FiBarChart2, FiAlertCircle, FiCheckCircle, 
  FiX, FiPlus, FiEdit3, FiTrash2, FiSearch, FiFilter, FiDownload,
  FiCalendar, FiCreditCard, FiPhone, FiMail, FiMapPin, FiInfo, FiUser,
  FiChevronDown
} from 'react-icons/fi';
import shopService from '../services/shopService';
import customerService from '../services/customerService';
import orderService from '../services/orderService';
import feedbackService from '../services/feedbackService';
import Footer from '../layouts/Footer';
import '../assets/css/shop-management.css';

const ShopManagement = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  
  // States
  const [shop, setShop] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('customers');
  
  // Customer states
  const [customers, setCustomers] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerFormVisible, setCustomerFormVisible] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({
    fullname: '',
    address: '',
    phone: '',
    email: ''
  });
  
  // Order states
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderFilterStatus, setOrderFilterStatus] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  // Search states
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  
  // Fetch shop details
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
      }
    } finally {
      setIsLoading(false);
    }
  }, [shopId, logout, navigate]);
  
  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoadingCustomers(true);
      const customersData = await customerService.getCustomersByShopId(shopId);
      setCustomers(customersData);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Không thể tải danh sách khách hàng. Vui lòng thử lại sau.');
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [shopId]);
  
  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoadingOrders(true);
      setError(null);
      const ordersData = await orderService.getOrdersByShopId(shopId);
      
      // Ensure orders is always an array, even if the API returns null/undefined
      const safeOrdersData = Array.isArray(ordersData) ? ordersData : [];
      
      // Filter out any invalid order entries (without required fields)
      const validOrders = safeOrdersData.filter(order => order && order.id);
      
      setOrders(validOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.');
      // Set orders to an empty array in case of error
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [shopId]);
  
  // Load data when component mounts
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    fetchShopDetails();
    
    if (activeTab === 'customers') {
      fetchCustomers();
    } else if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [isAuthenticated, navigate, fetchShopDetails, fetchCustomers, fetchOrders, activeTab]);
  
  // Effect để đóng dropdown khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (activeDropdown !== null) {
        const dropdownElements = document.querySelectorAll('.dropdown');
        
        // Kiểm tra xem click có nằm trong bất kỳ dropdown nào không
        let isInsideDropdown = false;
        dropdownElements.forEach((element) => {
          if (element.contains(event.target)) {
            isInsideDropdown = true;
          }
        });
        
        // Nếu click nằm ngoài tất cả dropdown, đóng dropdown đang mở
        if (!isInsideDropdown) {
          setActiveDropdown(null);
        }
      }
    }
    
    // Thêm event listener cho sự kiện click
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);
  
  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);
  
  // Filter customers by search term
  const filteredCustomers = useCallback(() => {
    if (!customerSearchTerm.trim()) return customers;
    
    return customers.filter(customer => 
      customer.fullname.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      customer.phone.includes(customerSearchTerm) ||
      customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase())
    );
  }, [customers, customerSearchTerm]);
  
  // Filter orders by search term and status
  const filteredOrders = useCallback(() => {
    let filtered = orders;
    
    if (orderSearchTerm.trim()) {
      filtered = filtered.filter(order => 
        order.customerName.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        order.productName.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        String(order.id).includes(orderSearchTerm)
      );
    }
    
    if (orderFilterStatus) {
      filtered = filtered.filter(order => order.status === orderFilterStatus);
    }
    
    return filtered;
  }, [orders, orderSearchTerm, orderFilterStatus]);
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
  };
  
  // Format date and time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit'
    });
  };
  
  // Handle customer form submit
  const handleCustomerFormSubmit = async (e) => {
    e.preventDefault();
    
    // Kiểm tra dữ liệu nhập vào
    if (!customerFormData.fullname.trim()) {
      setError('Vui lòng nhập họ tên khách hàng');
      return;
    }
    
    if (!customerFormData.phone.trim()) {
      setError('Vui lòng nhập số điện thoại khách hàng');
      return;
    }
    
    if (!customerFormData.email.trim()) {
      setError('Vui lòng nhập email khách hàng');
      return;
    }
    
    if (!customerFormData.address.trim()) {
      setError('Vui lòng nhập địa chỉ khách hàng');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Đảm bảo shopId được thêm vào dữ liệu
      const customerDataWithShopId = {
        ...customerFormData,
        shopId: parseInt(shopId) // Đảm bảo shopId là số
      };
      
      if (selectedCustomer) {
        // Cập nhật khách hàng hiện có
        await customerService.updateCustomer(shopId, selectedCustomer.id, customerDataWithShopId);
        setSuccess('Cập nhật thông tin khách hàng thành công!');
      } else {
        // Tạo khách hàng mới
        await customerService.createCustomer(shopId, customerDataWithShopId);
        setSuccess('Thêm khách hàng mới thành công!');
      }
      
      // Đóng form và reset dữ liệu
      setCustomerFormVisible(false);
      setCustomerFormData({ fullname: '', address: '', phone: '', email: '' });
      setSelectedCustomer(null);
      
      // Tải lại danh sách khách hàng
      fetchCustomers();
    } catch (err) {
      console.error('Error handling customer form:', err);
      
      // Xử lý các loại lỗi cụ thể
      if (err.response?.status === 409) {
        setError('Khách hàng với email hoặc số điện thoại này đã tồn tại trong cửa hàng');
      } else if (err.response?.status === 400) {
        setError('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin nhập vào');
      } else {
        setError('Không thể lưu thông tin khách hàng. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setIsLoading(true);
      setError(null);
      await orderService.updateOrderStatus(orderId, { status: newStatus });
      setSuccess(`Cập nhật trạng thái đơn hàng thành công!`);
      fetchOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Download orders as CSV
  const downloadOrdersCSV = () => {
    try {
      // Get orders to be exported
      let ordersToExport = [...orders];
      
      // Filter by status if a filter is applied
      if (orderFilterStatus) {
        ordersToExport = ordersToExport.filter(order => order.status === orderFilterStatus);
      }
      
      // Filter by search term if any
      if (orderSearchTerm) {
        ordersToExport = ordersToExport.filter(order => 
          order.customerName.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
          order.productName.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
          String(order.id).includes(orderSearchTerm)
        );
      }
      
      // Create CSV header
      const csvHeader = 'ID,Khách hàng,Sản phẩm,Số lượng,Đơn vị vận chuyển,Trạng thái,Ngày tạo,Ghi chú\n';
      
      // Create CSV content
      const csvRows = ordersToExport.map(order => {
        const status = {
          'PENDING': 'Chờ xác nhận',
          'CONFIRMED': 'Đã xác nhận',
          'SHIPPING': 'Đang giao hàng',
          'DELIVERED': 'Đã giao hàng',
          'CANCELLED': 'Đã hủy',
          'RETURNED': 'Đã trả hàng'
        }[order.status] || order.status;
        
        // Escape quotes in text fields
        const note = order.note ? `"${order.note.replace(/"/g, '""')}"` : '';
        const customerName = `"${order.customerName.replace(/"/g, '""')}"`;
        const productName = `"${order.productName.replace(/"/g, '""')}"`;
        const deliveryUnit = `"${order.deliveryUnit.replace(/"/g, '""')}"`;
        
        return `${order.id},${customerName},${productName},${order.quantity},${deliveryUnit},${status},${formatDate(order.createdAt)},${note}`;
      }).join('\n');
      
      // Combine header and rows
      const csvContent = csvHeader + csvRows;
      
      // Create a Blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `don-hang-${formatDate(new Date())}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccess('Xuất dữ liệu thành công!');
    } catch (err) {
      console.error('Error downloading CSV:', err);
      setError('Không thể xuất dữ liệu. Vui lòng thử lại sau.');
    }
  };
  
  // Function to delete a customer
  const deleteCustomer = async (customerId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      try {
        setIsLoading(true);
        setError(null);
        
        // Gọi API xóa khách hàng
        await customerService.deleteCustomer(customerId);
        
        setSuccess('Xóa khách hàng thành công!');
        
        // Tải lại danh sách khách hàng
        fetchCustomers();
      } catch (err) {
        console.error('Error deleting customer:', err);
        
        // Xử lý các loại lỗi cụ thể
        if (err.response?.status === 404) {
          setError('Không tìm thấy khách hàng này. Có thể đã bị xóa trước đó.');
        } else if (err.response?.status === 403) {
          setError('Bạn không có quyền xóa khách hàng này.');
        } else if (err.response?.status === 409) {
          setError('Không thể xóa khách hàng này vì có đơn hàng liên quan.');
        } else {
          setError('Không thể xóa khách hàng. Vui lòng thử lại sau.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Render customer management section
  const renderCustomers = () => (
    <div className="management-content">
      <div className="content-header">
        <h2><FiUsers className="header-icon" /> Quản lý khách hàng</h2>
        <button className="add-btn" onClick={() => {
          setCustomerFormData({
            fullname: '',
            address: '',
            phone: '',
            email: ''
          });
          setSelectedCustomer(null);
          setCustomerFormVisible(true);
        }}>
          <FiPlus /> Thêm khách hàng
        </button>
      </div>
      
      <div className="search-filter-bar">
        <div className="search-container">
          <FiSearch className="search-icon" />
          <input 
            type="text"
            value={customerSearchTerm}
            onChange={(e) => setCustomerSearchTerm(e.target.value)}
            placeholder="Tìm kiếm khách hàng..."
            className="search-input"
          />
        </div>
      </div>
      
      {customerFormVisible && (
        <div className="form-overlay">
          <div className="form-container">
            <div className="form-header">
              <h3>{selectedCustomer ? 'Cập nhật khách hàng' : 'Thêm khách hàng mới'}</h3>
              <button className="close-form-btn" onClick={() => {
                setCustomerFormVisible(false);
                setSelectedCustomer(null);
              }}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleCustomerFormSubmit} className="customer-form">
              <div className="form-group">
                <label><FiUser className="form-icon" /> Họ tên</label>
                <input 
                  type="text" 
                  value={customerFormData.fullname}
                  onChange={(e) => setCustomerFormData({...customerFormData, fullname: e.target.value})}
                  required
                  placeholder="Nhập họ tên khách hàng"
                />
              </div>
              <div className="form-group">
                <label><FiMapPin className="form-icon" /> Địa chỉ</label>
                <input 
                  type="text" 
                  value={customerFormData.address}
                  onChange={(e) => setCustomerFormData({...customerFormData, address: e.target.value})}
                  required
                  placeholder="Nhập địa chỉ khách hàng"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label><FiPhone className="form-icon" /> Số điện thoại</label>
                  <input 
                    type="tel" 
                    value={customerFormData.phone}
                    onChange={(e) => setCustomerFormData({...customerFormData, phone: e.target.value})}
                    required
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div className="form-group">
                  <label><FiMail className="form-icon" /> Email</label>
                  <input 
                    type="email" 
                    value={customerFormData.email}
                    onChange={(e) => setCustomerFormData({...customerFormData, email: e.target.value})}
                    required
                    placeholder="Nhập địa chỉ email"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => {
                    setCustomerFormVisible(false);
                    setSelectedCustomer(null);
                  }}
                  disabled={isLoading}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="loading-spinner small"></div>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    selectedCustomer ? 'Cập nhật' : 'Thêm mới'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {isLoadingCustomers ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách khách hàng...</p>
        </div>
      ) : filteredCustomers().length === 0 ? (
        <div className="empty-state">
          <FiUsers className="empty-icon" />
          <p>Chưa có khách hàng nào</p>
          <button className="add-first-btn" onClick={() => {
            setCustomerFormData({
              fullname: '',
              address: '',
              phone: '',
              email: ''
            });
            setSelectedCustomer(null);
            setCustomerFormVisible(true);
          }}>
            <FiPlus /> Thêm khách hàng đầu tiên
          </button>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên khách hàng</th>
                <th>Số điện thoại</th>
                <th>Email</th>
                <th>Địa chỉ</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers().map(customer => (
                <tr key={customer.id}>
                  <td>{customer.id}</td>
                  <td>{customer.fullname}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.email}</td>
                  <td>{customer.address}</td>
                  <td>{formatDate(customer.createdAt)}</td>
                  <td className="actions-cell">
                    <button 
                      className="action-btn edit-btn" 
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setCustomerFormData({
                          fullname: customer.fullname,
                          address: customer.address,
                          phone: customer.phone,
                          email: customer.email
                        });
                        setCustomerFormVisible(true);
                      }}
                    >
                      <FiEdit3 />
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => deleteCustomer(customer.id)}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
  
  // Render order management section
  const renderOrders = () => (
    <div className="management-content">
      <div className="content-header">
        <h2><FiShoppingCart className="header-icon" /> Quản lý đơn hàng</h2>
        <button className="download-btn" onClick={downloadOrdersCSV}>
          <FiDownload /> Xuất CSV
        </button>
      </div>
      
      <div className="search-filter-bar">
        <div className="search-container">
          <FiSearch className="search-icon" />
          <input 
            type="text"
            value={orderSearchTerm}
            onChange={(e) => setOrderSearchTerm(e.target.value)}
            placeholder="Tìm kiếm đơn hàng..."
            className="search-input"
          />
        </div>
        
        <div className="filter-container">
          <FiFilter className="filter-icon" />
          <select 
            value={orderFilterStatus}
            onChange={(e) => setOrderFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="SHIPPING">Đang giao hàng</option>
            <option value="DELIVERED">Đã giao hàng</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="RETURNED">Đã trả hàng</option>
          </select>
        </div>
      </div>
      
      {isLoadingOrders ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách đơn hàng...</p>
        </div>
      ) : filteredOrders().length === 0 ? (
        <div className="empty-state">
          <FiShoppingCart className="empty-icon" />
          <p>Chưa có đơn hàng nào</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Khách hàng</th>
                  <th>Sản phẩm</th>
                  <th>Số lượng</th>
                  <th>Đơn vị vận chuyển</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders().map(order => (
                  <tr key={order.id || 'unknown'}>
                    <td>{order.id || 'N/A'}</td>
                    <td>{order.customerName || 'N/A'}</td>
                    <td>{order.productName || 'N/A'}</td>
                    <td>{order.quantity || 0}</td>
                    <td>{order.deliveryUnit || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${(order.status || '').toLowerCase()}`}>
                        {order.status === 'PENDING' ? 'Chờ xác nhận' :
                         order.status === 'CONFIRMED' ? 'Đã xác nhận' :
                         order.status === 'SHIPPING' ? 'Đang giao hàng' :
                         order.status === 'DELIVERED' ? 'Đã giao hàng' :
                         order.status === 'CANCELLED' ? 'Đã hủy' : 
                         order.status === 'RETURNED' ? 'Đã trả hàng' : 'Không xác định'}
                      </span>
                    </td>
                    <td>{order.createdAt ? formatDateTime(order.createdAt) : 'N/A'}</td>
                    <td className="actions-cell">
                      <button 
                        className="action-btn info-btn" 
                        onClick={() => setSelectedOrder(order)}
                      >
                        <FiInfo />
                      </button>
                      <div className="dropdown">
                        <button 
                          className="dropdown-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === order.id ? null : order.id);
                          }}
                        >
                          <span className="dropdown-text">Trạng thái</span>
                          <FiChevronDown />
                        </button>
                        {activeDropdown === order.id && (
                          <div className="dropdown-content show">
                            <button 
                              className="dropdown-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, 'CONFIRMED');
                                setActiveDropdown(null);
                              }}
                              disabled={!order.status || order.status === 'CONFIRMED'}
                            >
                              Xác nhận
                            </button>
                            <button 
                              className="dropdown-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, 'SHIPPING');
                                setActiveDropdown(null);
                              }}
                              disabled={!order.status || order.status === 'SHIPPING' || order.status === 'PENDING'}
                            >
                              Đang giao hàng
                            </button>
                            <button 
                              className="dropdown-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, 'DELIVERED');
                                setActiveDropdown(null);
                              }}
                              disabled={!order.status || order.status === 'DELIVERED' || order.status === 'PENDING'}
                            >
                              Đã giao hàng
                            </button>
                            <button 
                              className="dropdown-item danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, 'CANCELLED');
                                setActiveDropdown(null);
                              }}
                              disabled={!order.status || order.status === 'CANCELLED' || order.status === 'DELIVERED'}
                            >
                              Hủy đơn
                            </button>
                            <button 
                              className="dropdown-item warning"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, 'RETURNED');
                                setActiveDropdown(null);
                              }}
                              disabled={!order.status || order.status === 'RETURNED' || order.status === 'PENDING' || order.status === 'CANCELLED'}
                            >
                              Trả hàng
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Chi tiết đơn hàng #{selectedOrder.id || 'N/A'}</h3>
              <button className="close-modal-btn" onClick={() => setSelectedOrder(null)}>
                <FiX />
              </button>
            </div>
            <div className="modal-content">
              <div className="order-details">
                <div className="detail-row">
                  <div className="detail-label"><FiUser className="detail-icon" /> Khách hàng:</div>
                  <div className="detail-value">{selectedOrder.customerName || 'N/A'}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label"><FiPackage className="detail-icon" /> Sản phẩm:</div>
                  <div className="detail-value">{selectedOrder.productName || 'N/A'}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label"><FiShoppingCart className="detail-icon" /> Số lượng:</div>
                  <div className="detail-value">{selectedOrder.quantity || 0}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label"><FiCreditCard className="detail-icon" /> Đơn vị vận chuyển:</div>
                  <div className="detail-value">{selectedOrder.deliveryUnit || 'N/A'}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label"><FiCalendar className="detail-icon" /> Ngày tạo:</div>
                  <div className="detail-value">{selectedOrder.createdAt ? formatDateTime(selectedOrder.createdAt) : 'N/A'}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label"><FiInfo className="detail-icon" /> Ghi chú:</div>
                  <div className="detail-value note">{selectedOrder.note || 'Không có ghi chú'}</div>
                </div>
              </div>
              <div className="modal-actions">
                <button className="modal-btn" onClick={() => setSelectedOrder(null)}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  // Render reports section placeholder
  const renderReports = () => (
    <div className="management-content">
      <div className="content-header">
        <h2><FiBarChart2 className="header-icon" /> Báo cáo & Thống kê</h2>
      </div>
      <div className="coming-soon">
        <div className="coming-soon-content">
          <FiBarChart2 className="coming-soon-icon" />
          <h3>Tính năng đang phát triển</h3>
          <p>Chức năng báo cáo và thống kê sẽ sớm được ra mắt. Vui lòng quay lại sau.</p>
        </div>
      </div>
    </div>
  );
  
  // Render feedbacks section placeholder
  const renderFeedbacks = () => (
    <div className="management-content">
      <div className="content-header">
        <h2><FiMessageSquare className="header-icon" /> Phản hồi khách hàng</h2>
      </div>
      <div className="coming-soon">
        <div className="coming-soon-content">
          <FiMessageSquare className="coming-soon-icon" />
          <h3>Tính năng đang phát triển</h3>
          <p>Chức năng quản lý phản hồi khách hàng sẽ sớm được ra mắt. Vui lòng quay lại sau.</p>
        </div>
      </div>
    </div>
  );
  
  // Render products section link to products page
  const renderProducts = () => (
    <div className="management-content">
      <div className="content-header">
        <h2><FiPackage className="header-icon" /> Quản lý sản phẩm</h2>
      </div>
      <div className="redirect-container">
        <div className="redirect-content">
          <FiPackage className="redirect-icon" />
          <h3>Quản lý sản phẩm</h3>
          <p>Quản lý danh sách sản phẩm, thêm sản phẩm mới và cập nhật tồn kho.</p>
          <button 
            className="redirect-btn"
            onClick={() => navigate(`/shop/${shopId}/products`)}
          >
            <FiArrowLeft className="flip-horizontal" /> Đi đến trang quản lý sản phẩm
          </button>
        </div>
      </div>
    </div>
  );
  
  // Render active tab content
  const renderContent = () => {
    switch (activeTab) {
      case 'customers':
        return renderCustomers();
      case 'orders':
        return renderOrders();
      case 'reports':
        return renderReports();
      case 'feedbacks':
        return renderFeedbacks();
      case 'products':
        return renderProducts();
      default:
        return renderCustomers();
    }
  };
  
  return (
    <div className="shop-management-container">
      <div className="management-header">
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
      
      <div className="management-main">
        <div className="management-sidebar">
          <div className="sidebar-links">
            <button 
              className={`sidebar-link ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => setActiveTab('customers')}
            >
              <FiUsers className="sidebar-icon" />
              <span>Khách hàng</span>
            </button>
            <button 
              className={`sidebar-link ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <FiShoppingCart className="sidebar-icon" />
              <span>Đơn hàng</span>
            </button>
            <button 
              className={`sidebar-link ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <FiPackage className="sidebar-icon" />
              <span>Sản phẩm</span>
            </button>
            <button 
              className={`sidebar-link ${activeTab === 'feedbacks' ? 'active' : ''}`}
              onClick={() => setActiveTab('feedbacks')}
            >
              <FiMessageSquare className="sidebar-icon" />
              <span>Phản hồi</span>
            </button>
            <button 
              className={`sidebar-link ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <FiBarChart2 className="sidebar-icon" />
              <span>Báo cáo</span>
            </button>
            <button 
              className="sidebar-link"
              onClick={() => navigate(`/shop/${shopId}/config`)}
            >
              <FiSettings className="sidebar-icon" />
              <span>Cấu hình</span>
            </button>
          </div>
        </div>
        
        {renderContent()}
      </div>
      
      <Footer />
    </div>
  );
};

export default ShopManagement; 