import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FiArrowLeft, FiShoppingBag, FiEdit, FiTrash2, FiDollarSign,
  FiPackage, FiAlertCircle, FiTag, FiLayers, FiInfo,
  FiCalendar, FiImage
} from 'react-icons/fi';
import productService from '../services/productService';
import shopService from '../services/shopService';
import Footer from '../layouts/Footer';
import '../assets/css/product-detail.css';

const ProductDetail = () => {
  const { shopId, productId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch shop details
  useEffect(() => {
    const fetchShopDetails = async () => {
      try {
        const shopData = await shopService.getShopById(shopId);
        setShop(shopData);
      } catch (err) {
        console.error('Error fetching shop details:', err);
        if (err.message && (err.message.includes('token') || err.response?.status === 401)) {
          logout();
          navigate('/login');
        }
      }
    };
    
    if (isAuthenticated()) {
      fetchShopDetails();
    } else {
      navigate('/login');
    }
  }, [shopId, isAuthenticated, logout, navigate]);
  
  // Fetch product details
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const productData = await productService.getShopProductById(shopId, productId);
        setProduct(productData);
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError('Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.');
        if (err.message && (err.message.includes('token') || err.response?.status === 401)) {
          logout();
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAuthenticated()) {
      fetchProductDetails();
    } else {
      navigate('/login');
    }
  }, [shopId, productId, isAuthenticated, logout, navigate]);
  
  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      return;
    }
    
    try {
      await productService.deleteProduct(shopId, productId);
      navigate(`/shop/${shopId}/products`);
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Không thể xóa sản phẩm. Vui lòng thử lại sau.');
    }
  };
  
  const handleUpdateStock = async (change) => {
    try {
      await productService.updateProductStock(shopId, productId, change);
      
      // Update product stock in local state
      setProduct(prev => ({
        ...prev,
        stock: prev.stock + change
      }));
    } catch (err) {
      console.error('Error updating stock:', err);
      setError('Không thể cập nhật tồn kho. Vui lòng thử lại sau.');
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return amount.toLocaleString('vi-VN') + ' ₫';
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (isLoading) {
    return (
      <div className="product-detail-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="product-detail-container">
        <div className="error-container">
          <FiAlertCircle className="error-icon" />
          <p>{error}</p>
          <button onClick={() => navigate(`/shop/${shopId}/products`)}>Quay lại danh sách</button>
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="product-detail-container">
        <div className="error-container">
          <FiAlertCircle className="error-icon" />
          <p>Không tìm thấy sản phẩm.</p>
          <button onClick={() => navigate(`/shop/${shopId}/products`)}>Quay lại danh sách</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="product-detail-container">
      <div className="detail-header">
        <button className="back-button" onClick={() => navigate(`/shop/${shopId}/products`)}>
          <FiArrowLeft /> Quay lại danh sách
        </button>
        <h1>
          <FiShoppingBag className="shop-icon" /> 
          {shop ? shop.name : 'Cửa hàng'}
        </h1>
        <div className="header-logo">
          <div className="logo-icon">AI</div>
          <span className="logo-text">Assistant</span>
        </div>
      </div>
      
      <div className="product-card">
        <div className="product-header">
          <div className="product-title">
            <h2>{product.name}</h2>
            <div className="product-badge">
              <span className="category-badge">{product.category}</span>
              <span className={`stock-badge ${product.stock <= 5 ? 'low-stock' : ''}`}>
                {product.stock === 0 ? 'Hết hàng' : `Còn ${product.stock} sản phẩm`}
              </span>
            </div>
          </div>
          
          <div className="product-actions">
            <button 
              className="action-btn edit-btn"
              onClick={() => navigate(`/shop/${shopId}/products`, { state: { editProductId: productId } })}
            >
              <FiEdit /> Chỉnh sửa
            </button>
            <button 
              className="action-btn delete-btn"
              onClick={handleDelete}
            >
              <FiTrash2 /> Xóa
            </button>
          </div>
        </div>
        
        <div className="product-content">
          <div className="product-image-container">
            {product.imageBase64 ? (
              <img 
                src={`data:image/jpeg;base64,${product.imageBase64}`} 
                alt={product.name}
                className="product-image"
              />
            ) : (
              <div className="no-image">
                <FiImage className="no-image-icon" />
                <p>Không có hình ảnh</p>
              </div>
            )}
          </div>
          
          <div className="product-info">
            <div className="info-group">
              <div className="info-label">
                <FiTag className="info-icon" /> Tên sản phẩm
              </div>
              <div className="info-value">{product.name}</div>
            </div>
            
            <div className="info-group">
              <div className="info-label">
                <FiDollarSign className="info-icon" /> Giá
              </div>
              <div className="info-value price-value">{formatCurrency(product.price)}</div>
            </div>
            
            <div className="info-group">
              <div className="info-label">
                <FiLayers className="info-icon" /> Tồn kho
              </div>
              <div className="info-value stock-container">
                <div className="stock-controls">
                  <button 
                    className="stock-btn decrease" 
                    onClick={() => handleUpdateStock(-1)}
                    disabled={product.stock <= 0}
                  >-</button>
                  <span className={`stock-value ${product.stock <= 5 ? 'low-stock' : ''}`}>
                    {product.stock}
                  </span>
                  <button 
                    className="stock-btn increase" 
                    onClick={() => handleUpdateStock(1)}
                  >+</button>
                </div>
              </div>
            </div>
            
            <div className="info-group">
              <div className="info-label">
                <FiTag className="info-icon" /> Danh mục
              </div>
              <div className="info-value">{product.category}</div>
            </div>
            
            <div className="info-group">
              <div className="info-label">
                <FiCalendar className="info-icon" /> Ngày tạo
              </div>
              <div className="info-value">{formatDate(product.createdAt)}</div>
            </div>
            
            <div className="info-group">
              <div className="info-label">
                <FiCalendar className="info-icon" /> Cập nhật lần cuối
              </div>
              <div className="info-value">{formatDate(product.updatedAt)}</div>
            </div>
            
            {product.description && (
              <div className="info-group description-group">
                <div className="info-label">
                  <FiInfo className="info-icon" /> Mô tả sản phẩm
                </div>
                <div className="info-value description-value">{product.description}</div>
              </div>
            )}
            
            {product.customFields && Object.keys(product.customFields).length > 0 && (
              <div className="info-group custom-fields-group">
                <div className="info-label">
                  <FiInfo className="info-icon" /> Thông tin bổ sung
                </div>
                <div className="info-value custom-fields-value">
                  {Object.entries(product.customFields).map(([key, value]) => (
                    <div key={key} className="custom-field-item">
                      <span className="field-key">{key}:</span>
                      <span className="field-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ProductDetail; 