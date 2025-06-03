import React, { useState } from 'react';
import { FiZap, FiX, FiImage, FiCheck, FiAlertCircle, FiInfo } from 'react-icons/fi';
import imageGenerationService from '../services/imageGenerationService';
import '../assets/css/product-image-generator.css';

const ProductImageGenerator = ({ productId, originalImageUrl, onSuccess }) => {
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  
  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('Vui lòng nhập mô tả cho hình ảnh bạn muốn tạo.');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      const result = await imageGenerationService.generateProductImage(productId, prompt);
      setGeneratedImage(result);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      console.error('Lỗi khi tạo hình ảnh:', err);
      setError(err.response?.data?.message || 'Không thể tạo hình ảnh. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    setPrompt('');
    setError('');
    setGeneratedImage(null);
  };
  
  const toggleInfo = () => {
    setShowInfo(!showInfo);
  };
  
  return (
    <div className="image-generator-container">
      <div className="image-generator-header">
        <h3><FiZap /> Tạo hình ảnh sản phẩm với AI</h3>
        <button className="info-button" onClick={toggleInfo}>
          <FiInfo />
        </button>
      </div>
      
      {showInfo && (
        <div className="info-box">
          <p>Tính năng này sử dụng AI để tạo hoặc chỉnh sửa hình ảnh sản phẩm của bạn.</p>
          <p>Nhập câu lệnh mô tả chi tiết thay đổi bạn muốn thực hiện trên hình ảnh.</p>
          <p>Ví dụ: "Thay đổi nền thành màu trắng" hoặc "Thêm ánh sáng vào sản phẩm".</p>
          <button className="close-info" onClick={toggleInfo}>
            <FiX /> Đóng
          </button>
        </div>
      )}
      
      <div className="image-preview-container">
        <div className="image-preview original">
          <h4>Hình ảnh hiện tại</h4>
          {originalImageUrl ? (
            <img src={originalImageUrl} alt="Hình ảnh sản phẩm hiện tại" />
          ) : (
            <div className="no-image">
              <FiImage />
              <p>Chưa có hình ảnh</p>
            </div>
          )}
        </div>
        
        <div className="image-preview generated">
          <h4>Hình ảnh được tạo</h4>
          {generatedImage ? (
            <img src={generatedImage.generatedImageUrl} alt="Hình ảnh được tạo bởi AI" />
          ) : (
            <div className="no-image">
              <FiZap />
              <p>Hình ảnh sẽ hiển thị ở đây</p>
            </div>
          )}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="image-generator-form">
        <div className="form-group">
          <label htmlFor="prompt">Mô tả điều bạn muốn thay đổi:</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={handlePromptChange}
            placeholder="Ví dụ: Thay đổi nền thành màu trắng, làm nổi bật sản phẩm..."
            rows={3}
            disabled={isSubmitting}
          ></textarea>
        </div>
        
        {error && (
          <div className="error-message">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}
        
        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <FiX /> Hủy
          </button>
          <button
            type="submit"
            className="generate-button"
            disabled={isSubmitting || !prompt.trim()}
          >
            {isSubmitting ? (
              <>
                <span className="loader"></span> Đang tạo...
              </>
            ) : (
              <>
                <FiZap /> Tạo hình ảnh
              </>
            )}
          </button>
        </div>
        
        {generatedImage && (
          <div className="generation-success">
            <FiCheck />
            <span>Hình ảnh đã được tạo thành công!</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProductImageGenerator; 