import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FiArrowLeft, FiShoppingBag, FiPlus, FiEdit, FiTrash2, FiRefreshCw,
  FiSearch, FiFilter, FiX, FiAlertCircle, FiCheckCircle, FiPackage,
  FiDollarSign, FiTag, FiLayers, FiImage, FiInfo, FiEye
} from 'react-icons/fi';
import productService from '../services/productService';
import shopService from '../services/shopService';
import Footer from '../layouts/Footer';
import '../assets/css/shop-products.css';

const ShopProducts = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  
  // States
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form states
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [productImage, setProductImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Pagination & filtering
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  
  // Product form data
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    stock: '',
    imageBase64: '',
    customFields: {}
  });
  
  // Custom fields form data
  const [customFieldKey, setCustomFieldKey] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');
  
  // Fetch shop details
  const fetchShopDetails = useCallback(async () => {
    try {
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
    }
  }, [shopId, logout, navigate]);
  
  // Fetch shop categories
  const fetchCategories = useCallback(async () => {
    try {
      const categoriesData = await productService.getShopCategories(shopId);
      setCategories(categoriesData || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Không hiển thị lỗi này cho người dùng
    }
  }, [shopId]);
  
  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await productService.getShopProducts(
        shopId, 
        page, 
        size, 
        keyword,
        sortBy,
        sortDir
      );
      
      setProducts(response.content || []);
      setTotalPages(response.totalPages || 0);
      
      // Fetch categories if needed
      if (categories.length === 0) {
        fetchCategories();
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.');
      if (err.message && (err.message.includes('token') || err.response?.status === 401)) {
        logout();
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [shopId, page, size, keyword, sortBy, sortDir, categories.length, fetchCategories, logout, navigate]);
  
  // Refresh product list
  const refreshProducts = () => {
    setIsRefreshing(true);
    fetchProducts();
  };
  
  // Load initial data
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    fetchShopDetails();
    fetchProducts();
  }, [isAuthenticated, navigate, fetchShopDetails, fetchProducts]);
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0); // Reset to first page
    fetchProducts();
  };
  
  // Reset search
  const resetSearch = () => {
    setKeyword('');
    setSelectedCategory('');
    setPage(0);
    setSortBy('id');
    setSortDir('asc');
    // Re-fetch with reset parameters
    setTimeout(fetchProducts, 0);
  };
  
  // Handle sorting
  const handleSort = (field) => {
    setSortDir(sortBy === field && sortDir === 'asc' ? 'desc' : 'asc');
    setSortBy(field);
    setPage(0);
    setTimeout(fetchProducts, 0);
  };
  
  // Handle category filter
  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    // You'd implement filtering by category here
  };
  
  // Handle pagination
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };
  
  // Open product form for creating
  const openCreateForm = () => {
    // Reset form
    setProductForm({
      name: '',
      price: '',
      description: '',
      category: '',
      stock: '',
      imageBase64: '',
      customFields: {}
    });
    setProductImage(null);
    setEditingProductId(null);
    setFormErrors({});
    setShowProductForm(true);
  };
  
  // Open product form for editing
  const openEditForm = async (productId) => {
    try {
      setIsLoading(true);
      const productData = await productService.getShopProductById(shopId, productId);
      
      setProductForm({
        name: productData.name || '',
        price: productData.price || '',
        description: productData.description || '',
        category: productData.category || '',
        stock: productData.stock || '',
        imageBase64: productData.imageBase64 || '',
        customFields: productData.customFields || {}
      });
      
      setEditingProductId(productId);
      setFormErrors({});
      setShowProductForm(true);
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError('Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle form change
  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };
  
  // Handle image change
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setProductImage(file);
        const base64 = await productService.fileToBase64(file);
        setProductForm(prev => ({
          ...prev,
          imageBase64: base64
        }));
      } catch (err) {
        console.error('Error converting image to base64:', err);
        setFormErrors(prev => ({
          ...prev,
          image: 'Không thể xử lý file hình ảnh'
        }));
      }
    }
  };
  
  // Add custom field
  const addCustomField = () => {
    if (!customFieldKey.trim() || !customFieldValue.trim()) {
      return;
    }
    
    setProductForm(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [customFieldKey]: customFieldValue
      }
    }));
    
    // Reset inputs
    setCustomFieldKey('');
    setCustomFieldValue('');
  };
  
  // Remove custom field
  const removeCustomField = (key) => {
    const newCustomFields = { ...productForm.customFields };
    delete newCustomFields[key];
    
    setProductForm(prev => ({
      ...prev,
      customFields: newCustomFields
    }));
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!productForm.name.trim()) {
      errors.name = 'Tên sản phẩm là bắt buộc';
    }
    
    if (!productForm.price) {
      errors.price = 'Giá sản phẩm là bắt buộc';
    } else if (isNaN(productForm.price) || Number(productForm.price) <= 0) {
      errors.price = 'Giá sản phẩm phải lớn hơn 0';
    }
    
    if (!productForm.category.trim()) {
      errors.category = 'Danh mục sản phẩm là bắt buộc';
    }
    
    if (!productForm.stock) {
      errors.stock = 'Số lượng tồn kho là bắt buộc';
    } else if (isNaN(productForm.stock) || Number(productForm.stock) < 0) {
      errors.stock = 'Số lượng tồn kho không được âm';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Submit form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formData = {
        ...productForm,
        price: Number(productForm.price),
        stock: Number(productForm.stock)
      };
      
      if (editingProductId) {
        // Update existing product
        await productService.updateProduct(shopId, editingProductId, formData);
        setSuccess('Sản phẩm đã được cập nhật thành công!');
      } else {
        // Create new product
        await productService.createProduct(shopId, formData);
        setSuccess('Sản phẩm mới đã được tạo thành công!');
      }
      
      // Reset & close form
      setShowProductForm(false);
      
      // Refresh product list
      fetchProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Không thể lưu sản phẩm. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete product
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      return;
    }
    
    try {
      await productService.deleteProduct(shopId, productId);
      setSuccess('Sản phẩm đã được xóa thành công!');
      
      // Refresh product list
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Không thể xóa sản phẩm. Vui lòng thử lại sau.');
    }
  };
  
  // Update product stock
  const handleUpdateStock = async (productId, change) => {
    try {
      await productService.updateProductStock(shopId, productId, change);
      setSuccess('Số lượng tồn kho đã được cập nhật!');
      
      // Update the stock in the local state
      setProducts(products.map(p => {
        if (p.id === productId) {
          return { ...p, stock: p.stock + change };
        }
        return p;
      }));
    } catch (err) {
      console.error('Error updating stock:', err);
      setError('Không thể cập nhật tồn kho. Vui lòng thử lại sau.');
    }
  };
  
  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);
  
  // Format currency
  const formatCurrency = (amount) => {
    return amount.toLocaleString('vi-VN') + ' ₫';
  };
  
  return (
    <div className="shop-products-container">
      <div className="products-header">
        <button className="back-button" onClick={() => navigate(`/shop/${shopId}/config`)}>
          <FiArrowLeft /> Quay lại cấu hình
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

      <div className="products-management">
        <div className="products-section-header">
          <h2><FiPackage className="section-icon" /> Quản lý sản phẩm</h2>
          <div className="product-actions">
            <button 
              className="add-product-btn"
              onClick={openCreateForm}
              type="button"
            >
              <FiPlus />
              <span>Thêm sản phẩm</span>
            </button>
          </div>
        </div>
        
        <div className="products-filters">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-container">
              <input 
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn">
                <FiSearch />
              </button>
            </div>
          </form>
          
          {categories.length > 0 && (
            <div className="category-filter">
              <span className="filter-label"><FiFilter /> Lọc:</span>
              <select 
                value={selectedCategory}
                onChange={(e) => handleCategoryFilter(e.target.value)}
                className="category-select"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
              
              {(keyword || selectedCategory) && (
                <button className="reset-filter-btn" onClick={resetSearch}>
                  <FiX /> Reset
                </button>
              )}
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Đang tải sản phẩm...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="no-products">
            <FiPackage className="no-products-icon" />
            <p>Chưa có sản phẩm nào.</p>
            <button className="add-first-product-btn" onClick={openCreateForm}>
              <FiPlus /> Thêm sản phẩm đầu tiên
            </button>
          </div>
        ) : (
          <div className="products-list">
            <table className="products-table">
              <thead>
                <tr>
                  <th className="image-col">Ảnh</th>
                  <th className="name-col clickable" onClick={() => handleSort('name')}>
                    Tên sản phẩm 
                    {sortBy === 'name' && (
                      <span className="sort-icon">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </th>
                  <th className="price-col clickable" onClick={() => handleSort('price')}>
                    Giá
                    {sortBy === 'price' && (
                      <span className="sort-icon">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </th>
                  <th className="category-col">Danh mục</th>
                  <th className="stock-col clickable" onClick={() => handleSort('stock')}>
                    Tồn kho
                    {sortBy === 'stock' && (
                      <span className="sort-icon">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </th>
                  <th className="actions-col">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td className="image-col">
                      {product.imageBase64 ? (
                        <img 
                          src={`data:image/jpeg;base64,${product.imageBase64}`} 
                          alt={product.name}
                          className="product-thumbnail"
                        />
                      ) : (
                        <div className="no-image">
                          <FiImage />
                        </div>
                      )}
                    </td>
                    <td className="name-col">
                      <div className="product-name">{product.name}</div>
                      {product.description && (
                        <div className="product-description">{product.description.substring(0, 50)}...</div>
                      )}
                    </td>
                    <td className="price-col">{formatCurrency(product.price)}</td>
                    <td className="category-col">
                      <span className="category-badge">{product.category}</span>
                    </td>
                    <td className="stock-col">
                      <div className="stock-controls">
                        <button 
                          className="stock-btn decrease" 
                          onClick={() => handleUpdateStock(product.id, -1)}
                          disabled={product.stock <= 0}
                        >-</button>
                        <span className={`stock-value ${product.stock <= 5 ? 'low-stock' : ''}`}>
                          {product.stock}
                        </span>
                        <button 
                          className="stock-btn increase" 
                          onClick={() => handleUpdateStock(product.id, 1)}
                        >+</button>
                      </div>
                    </td>
                    <td className="actions-col">
                      <div className="product-actions">
                        <button 
                          className="action-btn view-btn"
                          onClick={() => navigate(`/shop/${shopId}/products/${product.id}`)}
                          title="Xem chi tiết"
                        >
                          <FiEye />
                        </button>
                        <button 
                          className="action-btn edit-btn" 
                          onClick={() => openEditForm(product.id)}
                          title="Chỉnh sửa"
                        >
                          <FiEdit />
                        </button>
                        <button 
                          className="action-btn delete-btn" 
                          onClick={() => handleDeleteProduct(product.id)}
                          title="Xóa"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="page-btn" 
                  disabled={page === 0}
                  onClick={() => handlePageChange(page - 1)}
                >
                  &laquo; Trước
                </button>
                
                {[...Array(totalPages).keys()].map(pageNum => (
                  <button 
                    key={pageNum}
                    className={`page-btn ${page === pageNum ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum + 1}
                  </button>
                ))}
                
                <button 
                  className="page-btn" 
                  disabled={page === totalPages - 1}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Sau &raquo;
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Product Form Modal */}
      {showProductForm && (
        <div className="product-form-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                {editingProductId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h2>
              <button 
                className="close-modal-btn"
                onClick={() => setShowProductForm(false)}
              >
                <FiX />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="product-form">
              <div className="form-grid">
                <div className="form-left">
                  <div className="form-group">
                    <label htmlFor="name">
                      <FiTag className="form-icon" /> Tên sản phẩm *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={productForm.name}
                      onChange={handleFormChange}
                      placeholder="Nhập tên sản phẩm"
                      className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                    />
                    {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="price">
                        <FiDollarSign className="form-icon" /> Giá (VND) *
                      </label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={productForm.price}
                        onChange={handleFormChange}
                        placeholder="Nhập giá sản phẩm"
                        min="0"
                        step="1000"
                        className={`form-control ${formErrors.price ? 'is-invalid' : ''}`}
                      />
                      {formErrors.price && <div className="invalid-feedback">{formErrors.price}</div>}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="stock">
                        <FiLayers className="form-icon" /> Tồn kho *
                      </label>
                      <input
                        type="number"
                        id="stock"
                        name="stock"
                        value={productForm.stock}
                        onChange={handleFormChange}
                        placeholder="Nhập số lượng"
                        min="0"
                        className={`form-control ${formErrors.stock ? 'is-invalid' : ''}`}
                      />
                      {formErrors.stock && <div className="invalid-feedback">{formErrors.stock}</div>}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="category">
                      <FiFilter className="form-icon" /> Danh mục *
                    </label>
                    <input
                      type="text"
                      id="category"
                      name="category"
                      value={productForm.category}
                      onChange={handleFormChange}
                      placeholder="Nhập danh mục sản phẩm"
                      list="categories"
                      className={`form-control ${formErrors.category ? 'is-invalid' : ''}`}
                    />
                    <datalist id="categories">
                      {categories.map((category, index) => (
                        <option key={index} value={category} />
                      ))}
                    </datalist>
                    {formErrors.category && <div className="invalid-feedback">{formErrors.category}</div>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="description">
                      <FiInfo className="form-icon" /> Mô tả
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={productForm.description}
                      onChange={handleFormChange}
                      placeholder="Nhập mô tả sản phẩm"
                      rows="4"
                      className="form-control"
                    />
                  </div>
                </div>
                
                <div className="form-right">
                  <div className="form-group">
                    <label htmlFor="image">
                      <FiImage className="form-icon" /> Hình ảnh sản phẩm
                    </label>
                    <div className="image-upload-container">
                      {(productForm.imageBase64 || productImage) ? (
                        <div className="image-preview">
                          <img 
                            src={`data:image/jpeg;base64,${productForm.imageBase64}`}
                            alt="Preview" 
                          />
                          <button 
                            type="button" 
                            className="remove-image-btn"
                            onClick={() => {
                              setProductImage(null);
                              setProductForm(prev => ({ ...prev, imageBase64: '' }));
                            }}
                          >
                            <FiX />
                          </button>
                        </div>
                      ) : (
                        <div className="image-upload">
                          <input
                            type="file"
                            id="image"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="file-input"
                          />
                          <label htmlFor="image" className="file-label">
                            <FiImage className="upload-icon" />
                            <span>Chọn hình ảnh</span>
                          </label>
                        </div>
                      )}
                      {formErrors.image && <div className="invalid-feedback">{formErrors.image}</div>}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>
                      <FiInfo className="form-icon" /> Thông tin bổ sung
                    </label>
                    <div className="custom-fields-container">
                      <div className="custom-fields-form">
                        <input
                          type="text"
                          placeholder="Tên thuộc tính"
                          value={customFieldKey}
                          onChange={(e) => setCustomFieldKey(e.target.value)}
                          className="form-control custom-field-key"
                        />
                        <input
                          type="text"
                          placeholder="Giá trị"
                          value={customFieldValue}
                          onChange={(e) => setCustomFieldValue(e.target.value)}
                          className="form-control custom-field-value"
                        />
                        <button 
                          type="button" 
                          className="add-field-btn"
                          onClick={addCustomField}
                        >
                          <FiPlus />
                        </button>
                      </div>
                      
                      {Object.keys(productForm.customFields).length > 0 && (
                        <div className="custom-fields-list">
                          {Object.entries(productForm.customFields).map(([key, value]) => (
                            <div key={key} className="custom-field-item">
                              <span className="field-key">{key}:</span>
                              <span className="field-value">{value}</span>
                              <button 
                                type="button" 
                                className="remove-field-btn"
                                onClick={() => removeCustomField(key)}
                              >
                                <FiX />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowProductForm(false)}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="save-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <FiRefreshCw className="spinning" /> Đang lưu...
                    </>
                  ) : (
                    <>
                      {editingProductId ? 'Cập nhật' : 'Tạo sản phẩm'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default ShopProducts; 