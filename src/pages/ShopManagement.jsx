import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiArrowLeft, FiShoppingBag, FiUsers, FiShoppingCart, FiMessageSquare, 
  FiPackage, FiSettings, FiBarChart2, FiAlertCircle, FiCheckCircle, 
  FiX, FiPlus, FiEdit3, FiTrash2, FiSearch, FiFilter, FiDownload,
  FiCalendar, FiCreditCard, FiPhone, FiMail, FiMapPin, FiInfo, FiUser,
  FiChevronDown, FiPrinter
} from 'react-icons/fi';
import shopService from '../services/shopService';
import customerService from '../services/customerService';
import orderService from '../services/orderService';
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
    // Reports states
  const [reportData, setReportData] = useState(null);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('month'); // 'week', 'month', 'year'
  
  // Refs to track data fetch status
  const dataFetchedRef = useRef({
    customers: false,
    orders: false
  });// Fetch shop details
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
      dataFetchedRef.current.customers = true;
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
      dataFetchedRef.current.orders = true;
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.');
      // Set orders to an empty array in case of error
      setOrders([]);    } finally {
      setIsLoadingOrders(false);
    }
  }, [shopId]);
  
  // Calculate report statistics
  const calculateReportData = useCallback(() => {
    try {
      setIsLoadingReports(true);
      
      const now = new Date();
      let startDate, endDate;
      
      // Determine date range based on period
      switch (reportPeriod) {
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          endDate = now;
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
      
      // Filter orders by date range
      const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });
      
      // Calculate basic statistics
      const totalCustomers = customers.length;
      const totalOrders = orders.length;
      const ordersInPeriod = filteredOrders.length;
      
      // Calculate order status statistics
      const ordersByStatus = {
        pending: filteredOrders.filter(order => order.status === 'PENDING').length,
        confirmed: filteredOrders.filter(order => order.status === 'CONFIRMED').length,
        shipping: filteredOrders.filter(order => order.status === 'SHIPPING').length,
        delivered: filteredOrders.filter(order => order.status === 'DELIVERED').length,
        cancelled: filteredOrders.filter(order => order.status === 'CANCELLED').length,
        returned: filteredOrders.filter(order => order.status === 'RETURNED').length
      };
      
      // Calculate total quantity sold
      const totalQuantitySold = filteredOrders.reduce((sum, order) => sum + (order.quantity || 0), 0);
      
      // Calculate top products
      const productCounts = {};
      filteredOrders.forEach(order => {
        if (order.productName) {
          productCounts[order.productName] = (productCounts[order.productName] || 0) + (order.quantity || 0);
        }
      });
      
      const topProducts = Object.entries(productCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, quantity }));
      
      // Calculate customer activity
      const customerOrders = {};
      filteredOrders.forEach(order => {
        if (order.customerName) {
          customerOrders[order.customerName] = (customerOrders[order.customerName] || 0) + 1;
        }
      });
      
      const topCustomers = Object.entries(customerOrders)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, orderCount]) => ({ name, orderCount }));
      
      // Calculate daily order trends (for charts)
      const dailyOrders = {};
      filteredOrders.forEach(order => {
        const date = new Date(order.createdAt).toLocaleDateString('vi-VN');
        dailyOrders[date] = (dailyOrders[date] || 0) + 1;
      });
      
      const orderTrends = Object.entries(dailyOrders)
        .sort(([a], [b]) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')))
        .map(([date, count]) => ({ date, count }));
      
      setReportData({
        period: reportPeriod,
        dateRange: { startDate, endDate },
        totalCustomers,
        totalOrders,
        ordersInPeriod,
        ordersByStatus,
        totalQuantitySold,
        topProducts,
        topCustomers,
        orderTrends,
        completionRate: ordersInPeriod > 0 ? Math.round((ordersByStatus.delivered / ordersInPeriod) * 100) : 0,
        cancellationRate: ordersInPeriod > 0 ? Math.round((ordersByStatus.cancelled / ordersInPeriod) * 100) : 0
      });
      
    } catch (err) {
      console.error('Error calculating report data:', err);
      setError('Không thể tính toán dữ liệu báo cáo. Vui lòng thử lại sau.');
    } finally {
      setIsLoadingReports(false);
    }  }, [orders, customers, reportPeriod]);
  
  // Load data when component mounts
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    fetchShopDetails();
  }, [isAuthenticated, navigate, fetchShopDetails]);  // Load tab-specific data when activeTab changes
  useEffect(() => {
    if (!isAuthenticated()) return;
    
    if (activeTab === 'customers' && !dataFetchedRef.current.customers) {
      fetchCustomers();
    } else if (activeTab === 'orders' && !dataFetchedRef.current.orders) {
      fetchOrders();
    } else if (activeTab === 'reports') {
      // For reports, we need both customers and orders data
      if (!dataFetchedRef.current.customers) {
        fetchCustomers();
      }
      if (!dataFetchedRef.current.orders) {
        fetchOrders();
      }
    }
  }, [activeTab, isAuthenticated, fetchCustomers, fetchOrders]);

  // Calculate report data when orders/customers change or report period changes
  useEffect(() => {
    if (activeTab === 'reports' && orders.length > 0 && customers.length > 0) {
      calculateReportData();
    }
  }, [activeTab, orders, customers, reportPeriod, calculateReportData]);
  
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

  // Function to get customer details for an order
  const getCustomerDetailsForOrder = async (customerName) => {
    try {
      // Find customer by name from the customers list
      const customer = customers.find(c => c.fullname === customerName);
      if (customer) {
        return customer;
      }
      
      // If not found in current list, try to fetch all customers
      if (customers.length === 0) {
        await fetchCustomers();
        const updatedCustomer = customers.find(c => c.fullname === customerName);
        return updatedCustomer || null;
      }
      
      return null;
    } catch (err) {
      console.error('Error getting customer details:', err);
      return null;
    }
  };

  // Print individual order
  const printOrder = async (order) => {
    try {
      // Get customer details
      const customerDetails = await getCustomerDetailsForOrder(order.customerName);
      
      // Create print content
      const printContent = `
        <html>
          <head>
            <title>Đơn hàng #${order.id || 'N/A'}</title>            <style>              body {
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 15px;
                color: #333;
                line-height: 1.4;
                background: white;
              }
              .print-header {
                text-align: center;
                border-bottom: 3px solid #0056b3;
                padding-bottom: 12px;
                margin-bottom: 20px;
              }.print-header h1 {
                color: #0056b3;
                margin: 0;
                font-size: 24px;
                font-weight: bold;
              }              .print-header h2 {
                color: #666;
                margin: 6px 0 0 0;
                font-size: 14px;
                font-weight: normal;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .shop-info {
                text-align: center;
                margin-bottom: 15px;
                color: #666;
                font-size: 12px;
                font-style: italic;
              }
              .order-section {
                margin-bottom: 15px;
                border: 1px solid #e0e0e0;
                border-radius: 5px;
                overflow: hidden;
              }
              .section-title {
                background: linear-gradient(135deg, #0056b3, #0041a3);
                color: white;
                padding: 6px 12px;
                font-weight: bold;
                font-size: 12px;
                margin: 0;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .detail-table {
                width: 100%;
                border-collapse: collapse;
                margin: 0;
              }              .detail-table td {
                padding: 8px 12px;
                border-bottom: 1px solid #f0f0f0;
                vertical-align: top;
              }
              .detail-table td:first-child {
                font-weight: 600;
                color: #333;
                width: 120px;
                background-color: #f8f9fa;
                border-right: 1px solid #e0e0e0;
              }
              .detail-table td:last-child {
                color: #555;
              }
              .detail-table tr:last-child td {
                border-bottom: none;
              }              .status-badge {
                display: inline-block;
                padding: 3px 10px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .status-pending { background-color: #fff3cd; color: #856404; }
              .status-confirmed { background-color: #d1ecf1; color: #0c5460; }
              .status-shipping { background-color: #d4edda; color: #155724; }
              .status-delivered { background-color: #d4edda; color: #155724; }
              .status-cancelled { background-color: #f8d7da; color: #721c24; }
              .status-returned { background-color: #e2e3e5; color: #383d41; }              .print-footer {
                margin-top: 25px;
                padding: 12px;
                background-color: #f8f9fa;
                border-radius: 5px;
                text-align: center;
                color: #666;
                font-size: 11px;
                line-height: 1.6;
                border: 1px solid #e0e0e0;
              }
              .print-date {
                margin-top: 15px;
                text-align: right;
                color: #888;
                font-size: 11px;
                border-top: 1px solid #e0e0e0;
                padding-top: 8px;
              }              @media print {
                body { 
                  margin: 0; 
                  padding: 8px; 
                  font-size: 11px; 
                }
                .print-header { 
                  page-break-inside: avoid; 
                  margin-bottom: 15px;
                  border-bottom: 2px solid #333;
                }
                .order-section { 
                  page-break-inside: avoid; 
                  margin-bottom: 12px;
                  border: 1px solid #333;
                }
                .section-title {
                  background: #333 !important;
                  color: white !important;
                  font-size: 11px;
                  padding: 5px 10px;
                }
                .detail-table td {
                  padding: 6px 10px;
                }
                .print-footer {
                  margin-top: 20px;
                  padding: 10px;
                  border: 1px solid #333;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-header">
              <h1>${shop?.name || 'Cửa hàng'}</h1>
              <h2>HÓA ĐƠN ĐƠN HÀNG</h2>
            </div>
            
            <div class="shop-info">
              <strong>Thông tin cửa hàng:</strong> ${shop?.description || 'Không có mô tả'}
            </div>

            <div class="order-section">
              <div class="section-title">Thông tin đơn hàng</div>
              <table class="detail-table">
                <tr>
                  <td>Mã đơn hàng:</td>
                  <td><strong>#${order.id || 'N/A'}</strong></td>
                </tr>
                <tr>
                  <td>Ngày tạo:</td>
                  <td>${order.createdAt ? formatDateTime(order.createdAt) : 'N/A'}</td>
                </tr>
                <tr>
                  <td>Trạng thái:</td>
                  <td>
                    <span class="status-badge status-${(order.status || '').toLowerCase()}">
                      ${order.status === 'PENDING' ? 'Chờ xác nhận' :
                        order.status === 'CONFIRMED' ? 'Đã xác nhận' :
                        order.status === 'SHIPPING' ? 'Đang giao hàng' :
                        order.status === 'DELIVERED' ? 'Đã giao hàng' :
                        order.status === 'CANCELLED' ? 'Đã hủy' : 
                        order.status === 'RETURNED' ? 'Đã trả hàng' : 'Không xác định'}
                    </span>
                  </td>
                </tr>
              </table>
            </div>            ${customerDetails ? `
            <div class="order-section">
              <div class="section-title">Thông tin khách hàng</div>
              <table class="detail-table">
                <tr>
                  <td>Họ tên:</td>
                  <td>${customerDetails.fullname || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Số điện thoại:</td>
                  <td>${customerDetails.phone || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Địa chỉ:</td>
                  <td>${customerDetails.address || 'N/A'}</td>
                </tr>
              </table>
            </div>
            ` : `
            <div class="order-section">
              <div class="section-title">Thông tin khách hàng</div>
              <table class="detail-table">
                <tr>
                  <td>Tên khách hàng:</td>
                  <td>${order.customerName || 'N/A'}</td>
                </tr>
              </table>
            </div>
            `}<div class="order-section">
              <div class="section-title">Chi tiết sản phẩm</div>
              <table class="detail-table">
                <tr>
                  <td>Tên sản phẩm:</td>
                  <td>${order.productName || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Số lượng:</td>
                  <td>${order.quantity || 0}</td>
                </tr>
                ${order.note ? `
                <tr>
                  <td>Ghi chú:</td>
                  <td>${order.note}</td>
                </tr>
                ` : ''}
              </table>
            </div><div class="print-footer">
              <p><strong>Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ!</strong></p>
            </div>

            <div class="print-date">
              <strong>Ngày in:</strong> ${formatDateTime(new Date().toISOString())}
            </div>
          </body>
        </html>
      `;

      // Open print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
        setSuccess('In đơn hàng thành công!');
      } else {
        setError('Không thể mở cửa sổ in. Vui lòng kiểm tra cài đặt trình duyệt.');
      }
    } catch (err) {
      console.error('Error printing order:', err);
      setError('Không thể in đơn hàng. Vui lòng thử lại sau.');
    }
  };

  // Print all orders
  const printAllOrders = async () => {
    try {
      // Get filtered orders
      const ordersToPrint = filteredOrders();
      
      if (ordersToPrint.length === 0) {
        setError('Không có đơn hàng nào để in.');
        return;
      }

      // Fetch customer details for all orders
      const ordersWithCustomers = await Promise.all(
        ordersToPrint.map(async (order) => {
          const customerDetails = await getCustomerDetailsForOrder(order.customerName);
          return { ...order, customerDetails };
        })
      );

      // Create print content for all orders
      const printContent = `
        <html>
          <head>
            <title>Danh sách đơn hàng - ${shop?.name || 'Cửa hàng'}</title>
            <style>              body {
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 15px;
                color: #333;
                line-height: 1.4;
              }
              .print-header {
                text-align: center;
                border-bottom: 2px solid #0056b3;
                padding-bottom: 15px;
                margin-bottom: 25px;
              }.print-header h1 {
                color: #0056b3;
                margin: 0;
                font-size: 24px;
              }              .print-header h2 {
                color: #666;
                margin: 4px 0 0 0;
                font-size: 16px;
                font-weight: normal;
              }
              .summary-info {
                background-color: #f8f9fa;
                padding: 12px;
                border-radius: 5px;
                margin-bottom: 25px;
                border-left: 4px solid #0056b3;
                border: 1px solid #e0e0e0;
              }              .orders-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 25px;
                font-size: 11px;
                border: 1px solid #ddd;
              }
              .orders-table th,
              .orders-table td {
                padding: 6px 4px;
                border: 1px solid #ddd;
                text-align: left;
                vertical-align: top;
              }              .orders-table th {
                background: linear-gradient(135deg, #0056b3, #0041a3);
                color: white;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-size: 10px;
              }
              .orders-table tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              .status-badge {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 10px;
                font-weight: bold;
                text-transform: uppercase;
              }
              .status-pending { background-color: #fff3cd; color: #856404; }
              .status-confirmed { background-color: #d1ecf1; color: #0c5460; }
              .status-shipping { background-color: #d4edda; color: #155724; }
              .status-delivered { background-color: #d4edda; color: #155724; }
              .status-cancelled { background-color: #f8d7da; color: #721c24; }
              .status-returned { background-color: #e2e3e5; color: #383d41; }              .print-footer {
                margin-top: 30px;
                padding: 15px;
                border-top: 2px solid #0056b3;
                text-align: center;
                color: #666;
                font-size: 11px;
                background-color: #f8f9fa;
                border-radius: 5px;
                border: 1px solid #e0e0e0;
              }
              .print-date {
                margin-top: 15px;
                text-align: right;
                color: #666;
                font-size: 12px;
                border-top: 1px solid #e0e0e0;
                padding-top: 8px;
              }              @media print {
                body { margin: 0; padding: 10px; font-size: 10px; }
                .print-header { 
                  page-break-inside: avoid; 
                  border-bottom: 2px solid #333;
                  margin-bottom: 20px;
                }
                .summary-info {
                  margin-bottom: 20px;
                  border: 1px solid #333;
                  page-break-inside: avoid;
                }
                .orders-table { 
                  page-break-inside: auto; 
                  font-size: 9px;
                  border: 2px solid #333;
                }
                .orders-table th {
                  background: #333 !important;
                  color: white !important;
                }
                .orders-table th,
                .orders-table td {
                  padding: 4px 3px;
                  border: 1px solid #333;
                }
                .orders-table tr { page-break-inside: avoid; }
                .print-footer {
                  border: 1px solid #333;
                  margin-top: 20px;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-header">
              <h1>${shop?.name || 'Cửa hàng'}</h1>
              <h2>DANH SÁCH ĐƠN HÀNG</h2>
            </div>
            
            <div class="summary-info">
              <strong>Tổng số đơn hàng:</strong> ${ordersToPrint.length} đơn hàng<br>
              <strong>Ngày xuất báo cáo:</strong> ${formatDateTime(new Date().toISOString())}<br>
              ${orderFilterStatus ? `<strong>Lọc theo trạng thái:</strong> ${
                orderFilterStatus === 'PENDING' ? 'Chờ xác nhận' :
                orderFilterStatus === 'CONFIRMED' ? 'Đã xác nhận' :
                orderFilterStatus === 'SHIPPING' ? 'Đang giao hàng' :
                orderFilterStatus === 'DELIVERED' ? 'Đã giao hàng' :
                orderFilterStatus === 'CANCELLED' ? 'Đã hủy' :
                orderFilterStatus === 'RETURNED' ? 'Đã trả hàng' : orderFilterStatus
              }<br>` : ''}
              ${orderSearchTerm ? `<strong>Từ khóa tìm kiếm:</strong> "${orderSearchTerm}"<br>` : ''}
            </div>            <table class="orders-table">
              <thead>
                <tr>
                  <th style="width: 10%;">Mã ĐH</th>
                  <th style="width: 25%;">Khách hàng</th>
                  <th style="width: 15%;">Số điện thoại</th>
                  <th style="width: 25%;">Sản phẩm</th>
                  <th style="width: 10%;">Số lượng</th>
                  <th style="width: 15%;">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                ${ordersWithCustomers.map(order => `
                  <tr>
                    <td>#${order.id || 'N/A'}</td>
                    <td>
                      <strong>${order.customerName || 'N/A'}</strong>
                    </td>
                    <td>${order.customerDetails?.phone || 'N/A'}</td>
                    <td>${order.productName || 'N/A'}</td>
                    <td style="text-align: center;">${order.quantity || 0}</td>
                    <td>
                      <span class="status-badge status-${(order.status || '').toLowerCase()}">
                        ${order.status === 'PENDING' ? 'Chờ xác nhận' :
                          order.status === 'CONFIRMED' ? 'Đã xác nhận' :
                          order.status === 'SHIPPING' ? 'Đang giao hàng' :
                          order.status === 'DELIVERED' ? 'Đã giao hàng' :
                          order.status === 'CANCELLED' ? 'Đã hủy' : 
                          order.status === 'RETURNED' ? 'Đã trả hàng' : 'N/A'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="print-footer">
              <p>Báo cáo được tạo tự động từ hệ thống quản lý cửa hàng</p>
              <p><strong>${shop?.name || 'Cửa hàng'}</strong></p>
            </div>

            <div class="print-date">
              <strong>Thời gian in:</strong> ${formatDateTime(new Date().toISOString())}
            </div>
          </body>
        </html>
      `;

      // Open print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
        setSuccess(`In thành công ${ordersToPrint.length} đơn hàng!`);
      } else {
        setError('Không thể mở cửa sổ in. Vui lòng kiểm tra cài đặt trình duyệt.');
      }
    } catch (err) {
      console.error('Error printing all orders:', err);
      setError('Không thể in danh sách đơn hàng. Vui lòng thử lại sau.');
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
        <div className="header-actions">
          <button className="action-btn print-all-btn" onClick={printAllOrders}>
            <FiPrinter /> In tất cả
          </button>
          <button className="download-btn" onClick={downloadOrdersCSV}>
            <FiDownload /> Xuất CSV
          </button>
        </div>
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
                    <td>{order.createdAt ? formatDateTime(order.createdAt) : 'N/A'}</td>                    <td className="actions-cell">
                      <button 
                        className="action-btn info-btn" 
                        onClick={() => setSelectedOrder(order)}
                      >
                        <FiInfo />
                      </button>
                      <button 
                        className="action-btn print-btn" 
                        onClick={() => printOrder(order)}
                      >
                        <FiPrinter />
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
                </div>              </div>
              <div className="modal-actions">
                <button className="modal-btn print-btn" onClick={() => printOrder(selectedOrder)}>
                  <FiPrinter /> In đơn hàng
                </button>
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
  
  // Render reports section
  const renderReports = () => (
    <div className="management-content">
      <div className="content-header">
        <h2><FiBarChart2 className="header-icon" /> Báo cáo thống kê</h2>
        <div className="header-actions">
          <select 
            value={reportPeriod} 
            onChange={(e) => setReportPeriod(e.target.value)}
            className="period-select"
          >
            <option value="week">7 ngày qua</option>
            <option value="month">Tháng này</option>
            <option value="year">Năm này</option>
          </select>
          <button 
            className="refresh-btn"
            onClick={calculateReportData}
            disabled={isLoadingReports}
          >
            <FiBarChart2 />
            {isLoadingReports ? 'Đang tính toán...' : 'Làm mới'}
          </button>
        </div>
      </div>

      {isLoadingReports ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tính toán dữ liệu báo cáo...</p>
        </div>
      ) : reportData ? (
        <div className="reports-container">
          {/* Overview Statistics */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon customers">
                <FiUsers />
              </div>
              <div className="stat-content">
                <h3>{reportData.totalCustomers}</h3>
                <p>Tổng khách hàng</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon orders">
                <FiShoppingCart />
              </div>
              <div className="stat-content">
                <h3>{reportData.ordersInPeriod}</h3>
                <p>Đơn hàng {reportPeriod === 'week' ? '7 ngày' : reportPeriod === 'month' ? 'tháng này' : 'năm này'}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon products">
                <FiPackage />
              </div>
              <div className="stat-content">
                <h3>{reportData.totalQuantitySold}</h3>
                <p>Sản phẩm đã bán</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon success">
                <FiCheckCircle />
              </div>
              <div className="stat-content">
                <h3>{reportData.completionRate}%</h3>
                <p>Tỷ lệ hoàn thành</p>
              </div>
            </div>
          </div>

          {/* Order Status Chart */}
          <div className="chart-section">
            <h3>Trạng thái đơn hàng</h3>
            <div className="status-chart">
              <div className="status-item">
                <div className="status-bar pending" style={{width: `${reportData.ordersInPeriod > 0 ? (reportData.ordersByStatus.pending / reportData.ordersInPeriod) * 100 : 0}%`}}></div>
                <span>Chờ xác nhận: {reportData.ordersByStatus.pending}</span>
              </div>
              <div className="status-item">
                <div className="status-bar confirmed" style={{width: `${reportData.ordersInPeriod > 0 ? (reportData.ordersByStatus.confirmed / reportData.ordersInPeriod) * 100 : 0}%`}}></div>
                <span>Đã xác nhận: {reportData.ordersByStatus.confirmed}</span>
              </div>
              <div className="status-item">
                <div className="status-bar shipping" style={{width: `${reportData.ordersInPeriod > 0 ? (reportData.ordersByStatus.shipping / reportData.ordersInPeriod) * 100 : 0}%`}}></div>
                <span>Đang giao: {reportData.ordersByStatus.shipping}</span>
              </div>
              <div className="status-item">
                <div className="status-bar delivered" style={{width: `${reportData.ordersInPeriod > 0 ? (reportData.ordersByStatus.delivered / reportData.ordersInPeriod) * 100 : 0}%`}}></div>
                <span>Đã giao: {reportData.ordersByStatus.delivered}</span>
              </div>
              <div className="status-item">
                <div className="status-bar cancelled" style={{width: `${reportData.ordersInPeriod > 0 ? (reportData.ordersByStatus.cancelled / reportData.ordersInPeriod) * 100 : 0}%`}}></div>
                <span>Đã hủy: {reportData.ordersByStatus.cancelled}</span>
              </div>
              <div className="status-item">
                <div className="status-bar returned" style={{width: `${reportData.ordersInPeriod > 0 ? (reportData.ordersByStatus.returned / reportData.ordersInPeriod) * 100 : 0}%`}}></div>
                <span>Đã trả: {reportData.ordersByStatus.returned}</span>
              </div>
            </div>
          </div>

          {/* Top Products and Customers */}
          <div className="reports-grid">
            <div className="report-section">
              <h3>Sản phẩm bán chạy</h3>
              <div className="top-list">
                {reportData.topProducts.length > 0 ? reportData.topProducts.map((product, index) => (
                  <div key={index} className="top-item">
                    <span className="rank">#{index + 1}</span>
                    <span className="name">{product.name}</span>
                    <span className="value">{product.quantity} sản phẩm</span>
                  </div>
                )) : (
                  <p className="no-data">Chưa có dữ liệu sản phẩm</p>
                )}
              </div>
            </div>
            
            <div className="report-section">
              <h3>Khách hàng tích cực</h3>
              <div className="top-list">
                {reportData.topCustomers.length > 0 ? reportData.topCustomers.map((customer, index) => (
                  <div key={index} className="top-item">
                    <span className="rank">#{index + 1}</span>
                    <span className="name">{customer.name}</span>
                    <span className="value">{customer.orderCount} đơn hàng</span>
                  </div>
                )) : (
                  <p className="no-data">Chưa có dữ liệu khách hàng</p>
                )}
              </div>
            </div>
          </div>

          {/* Order Trends */}
          {reportData.orderTrends.length > 0 && (
            <div className="chart-section">
              <h3>Xu hướng đơn hàng theo ngày</h3>
              <div className="trend-chart">
                {reportData.orderTrends.map((trend, index) => (
                  <div key={index} className="trend-item">
                    <div className="trend-date">{trend.date}</div>
                    <div className="trend-bar-container">
                      <div 
                        className="trend-bar" 
                        style={{
                          height: `${Math.max((trend.count / Math.max(...reportData.orderTrends.map(t => t.count))) * 100, 10)}%`
                        }}
                      ></div>
                    </div>
                    <div className="trend-count">{trend.count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <FiBarChart2 className="empty-icon" />
          <h3>Chưa có dữ liệu báo cáo</h3>
          <p>Vui lòng thêm khách hàng và đơn hàng để xem báo cáo thống kê.</p>
          <button className="primary-btn" onClick={calculateReportData}>
            <FiBarChart2 /> Tạo báo cáo
          </button>
        </div>
      )}
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
  
  // Render feedbacks section (placeholder for future development)
  const renderFeedbacks = () => (
    <div className="management-content">
      <div className="content-header">
        <h2><FiMessageSquare className="header-icon" /> Quản lý phản hồi</h2>
      </div>
      <div className="redirect-container">
        <div className="redirect-content">
          <FiMessageSquare className="redirect-icon" />
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