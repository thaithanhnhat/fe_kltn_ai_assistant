import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../layouts/MainLayout';
import '../assets/css/home.css';
import { useNavigate } from 'react-router-dom';

// Chat Animation Component
const ChatWindow = () => {
  // Dữ liệu cuộc hội thoại - rút gọn các tin nhắn để dễ hiển thị
  const conversation = [
    { type: 'bot', text: 'Xin chào! Tôi là trợ lý ảo AI. Tôi có thể giúp gì cho bạn?' },
    { type: 'user', text: 'Trợ lý ảo giúp doanh nghiệp tôi như thế nào?' },
    { type: 'bot', text: 'Chúng tôi giúp tự động hóa chăm sóc khách hàng, trả lời câu hỏi thường gặp và hỗ trợ 24/7.' },
    { type: 'user', text: 'Có thể tích hợp với website không?' },
    { type: 'bot', text: 'Vâng! Bạn có thể tích hợp qua iframe, Telegram và Messenger rất dễ dàng.' },
    { type: 'user', text: 'Chi phí sử dụng là bao nhiêu?' },
    { type: 'bot', text: 'Chúng tôi có nhiều gói, từ miễn phí đến doanh nghiệp. Xem chi tiết tại trang Bảng giá.' }
  ];

  const [visibleMessages, setVisibleMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Tạo ref để tham chiếu đến phần tử chat-messages
  const messagesContainerRef = useRef(null);

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const scrollHeight = messagesContainerRef.current.scrollHeight;
      const height = messagesContainerRef.current.clientHeight;
      const maxScrollTop = scrollHeight - height;
      
      // Sử dụng requestAnimationFrame để đảm bảo DOM đã cập nhật
      requestAnimationFrame(() => {
        messagesContainerRef.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
      });
    }
  };

  // Cập nhật tin nhắn và đảm bảo cuộn
  useEffect(() => {
    if (currentIndex < conversation.length) {
      const message = conversation[currentIndex];
      
      if (message.type === 'bot') {
        setIsTyping(true);
        
        // Giảm thời gian chờ cho bot
        const typingTimer = setTimeout(() => {
          setIsTyping(false);
          setVisibleMessages(prev => [...prev, message]);
          setCurrentIndex(prevIndex => prevIndex + 1);
        }, 1000); // Giảm từ 1500ms xuống 1000ms
        
        return () => clearTimeout(typingTimer);
      } else {
        // Tin nhắn người dùng hiển thị ngay lập tức
        const userMsgTimer = setTimeout(() => {
          setVisibleMessages(prev => [...prev, message]);
          setCurrentIndex(prevIndex => prevIndex + 1);
        }, 300); // Thêm delay nhỏ giữa các tin nhắn người dùng
        
        return () => clearTimeout(userMsgTimer);
      }
    }
  }, [currentIndex, conversation]);

  // Đảm bảo cuộn xuống sau khi DOM cập nhật với tin nhắn mới
  useEffect(() => {
    if (visibleMessages.length > 0 || isTyping) {
      scrollToBottom();
    }
  }, [visibleMessages, isTyping]);

  // Khởi động cuộc trò chuyện
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      setCurrentIndex(0);
    }, 300);
    
    return () => clearTimeout(initialTimer);
  }, []);

  // Restart conversation khi kết thúc
  useEffect(() => {
    if (currentIndex >= conversation.length) {
      const restartTimer = setTimeout(() => {
        setVisibleMessages([]);
        setCurrentIndex(0);
      }, 4000); // Giảm thời gian chờ trước khi restart
      
      return () => clearTimeout(restartTimer);
    }
  }, [currentIndex, conversation.length]);

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-title">AI Assistant</div>
        <div className="chat-actions">
          <div className="action-dot"></div>
          <div className="action-dot"></div>
          <div className="action-dot"></div>
        </div>
      </div>
      <div className="chat-messages" ref={messagesContainerRef}>
        {visibleMessages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.type === 'bot' ? 'bot-message' : 'user-message'}`}
            style={{ '--animation-order': index * 0.2 }} // Giảm delay animation
          >
            {msg.text}
          </div>
        ))}
        
        {isTyping && (
          <div className="typing-indicator">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        )}
      </div>
      <div className="chat-input">
        <input type="text" className="chat-input-field" placeholder="Nhập tin nhắn..." />
        <button className="send-button">→</button>
      </div>
    </div>
  );
};

// Icon components for platform and features
const TelegramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none">
    <path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z" fill="#039BE5"/>
    <path d="M5.491 11.74l11.57-4.461c.537-.194 1.006.131.832.943l.001-.001-1.97 9.281c-.146.658-.537.818-1.084.508l-3-2.211-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953z" fill="#FFF"/>
  </svg>
);

const MessengerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none">
    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.652V24l4.088-2.242c1.086.301 2.247.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0z" fill="#0084FF"/>
    <path d="M4.868 14.963L8.69 8.996l3.995 3.135L16.13 8.996l3.821 5.967-3.995-2.218-3.06 2.218-3.995-2.218-3.06 2.218-1.998 1.109.027-.109z" fill="#FFFFFF"/>
  </svg>
);

const WebsiteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none">
    <rect width="22" height="18" x="1" y="3" rx="2" stroke="#4F46E5" strokeWidth="2" fill="#EEF2FF"/>
    <path d="M1 7h22" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="4" cy="5" r="1" fill="#4F46E5"/>
    <circle cx="7" cy="5" r="1" fill="#4F46E5"/>
    <circle cx="10" cy="5" r="1" fill="#4F46E5"/>
    <path d="M2 11h20v9c0 .552-.448 1-1 1H3c-.552 0-1-.448-1-1v-9z" fill="#EEF2FF"/>
    <rect x="5" y="13" width="14" height="2" rx="1" fill="#4F46E5" opacity="0.7"/>
    <rect x="5" y="17" width="8" height="2" rx="1" fill="#4F46E5" opacity="0.7"/>
  </svg>
);

// Thêm các icon cho Features
const AIIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none">
    <path d="M12 2l9 4.5v11L12 22l-9-4.5v-11L12 2z" stroke="#4F46E5" strokeWidth="2" fill="#EEF2FF"/>
    <path d="M12 22v-6.5M12 12V2M3 6.5l9 5.5M3 17.5l9-5.5M21 17.5l-9-5.5M21 6.5l-9 5.5" stroke="#4F46E5" strokeWidth="2"/>
    <circle cx="12" cy="12" r="2" fill="#4F46E5"/>
  </svg>
);

const SupportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="#4F46E5" strokeWidth="2" fill="#EEF2FF"/>
    <path d="M12 12V6" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 12L17 12" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="12" r="1" fill="#4F46E5"/>
  </svg>
);

const IntegrationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none">
    <rect x="3" y="3" width="7" height="7" rx="1" stroke="#4F46E5" strokeWidth="2" fill="#EEF2FF"/>
    <rect x="14" y="3" width="7" height="7" rx="1" stroke="#4F46E5" strokeWidth="2" fill="#EEF2FF"/>
    <rect x="3" y="14" width="7" height="7" rx="1" stroke="#4F46E5" strokeWidth="2" fill="#EEF2FF"/>
    <rect x="14" y="14" width="7" height="7" rx="1" stroke="#4F46E5" strokeWidth="2" fill="#EEF2FF"/>
    <path d="M10 7h4M12 7v10M10 17h4" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const SecurityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none">
    <path d="M12 2L4 5v6c0 5.523 3.477 10 8 10s8-4.477 8-10V5l-8-3z" stroke="#4F46E5" strokeWidth="2" fill="#EEF2FF"/>
    <path d="M8 11l3 3 5-5" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AnalyticsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="#4F46E5" strokeWidth="2" fill="#EEF2FF"/>
    <path d="M7 14l3-3 3 3 4-4" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LanguageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="#4F46E5" strokeWidth="2" fill="#EEF2FF"/>
    <path d="M12 2v20M2 12h20" stroke="#4F46E5" strokeWidth="2"/>
    <path d="M8 6c1.333 2.667 2 5.333 2 8s-.667 5.333-2 8M16 6c-1.333 2.667-2 5.333-2 8s.667 5.333 2 8" stroke="#4F46E5" strokeWidth="1.5"/>
  </svg>
);

const Home = () => {
  const navigate = useNavigate();

  const handleTryFreeClick = () => {
    navigate('/login');
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">Trợ lý ảo thông minh cho doanh nghiệp Việt Nam</h1>
            <p className="hero-subtitle">
              Tối ưu hoá quy trình chăm sóc khách hàng và tăng hiệu quả kinh doanh với trợ lý ảo AI đa nền tảng: Telegram, Messenger và Website.
            </p>
            <div className="hero-buttons">
              <button className="btn-primary" onClick={handleTryFreeClick}>Dùng thử miễn phí</button>
              <button className="btn-secondary">Xem demo</button>
            </div>
          </div>
          <div className="hero-visual">
            <ChatWindow />
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section className="platforms">
        <h2 className="section-title">Hỗ trợ đa nền tảng</h2>
        <p className="section-subtitle">
          Trợ lý ảo AI của chúng tôi hoạt động liền mạch trên nhiều nền tảng khác nhau,
          giúp doanh nghiệp của bạn tiếp cận khách hàng ở mọi nơi.
        </p>
        <div className="platforms-container">
          <div className="platform-card">
            <div className="platform-icon">
              <TelegramIcon />
            </div>
            <h3 className="platform-title">Telegram</h3>
            <p className="platform-description">
              Tích hợp trợ lý ảo vào Telegram để tương tác với khách hàng nhanh chóng và hiệu quả
              thông qua nền tảng nhắn tin phổ biến này.
            </p>
            <a href="#" className="platform-link">Tìm hiểu thêm →</a>
          </div>
          
          <div className="platform-card">
            <div className="platform-icon">
              <MessengerIcon />
            </div>
            <h3 className="platform-title">Messenger</h3>
            <p className="platform-description">
              Kết nối với khách hàng thông qua Facebook Messenger, nơi có hàng triệu người dùng Việt Nam
              đang hoạt động hàng ngày.
            </p>
            <a href="#" className="platform-link">Tìm hiểu thêm →</a>
          </div>
          
          <div className="platform-card">
            <div className="platform-icon">
              <WebsiteIcon />
            </div>
            <h3 className="platform-title">Website</h3>
            <p className="platform-description">
              Dễ dàng nhúng trợ lý ảo vào website của bạn thông qua iframe đơn giản,
              mang lại trải nghiệm hỗ trợ khách hàng liền mạch.
            </p>
            <a href="#" className="platform-link">Tìm hiểu thêm →</a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2 className="section-title">Tính năng nổi bật</h2>
        <p className="section-subtitle">
          Trợ lý ảo AI của chúng tôi được trang bị nhiều tính năng tiên tiến
          giúp doanh nghiệp của bạn tối ưu hóa quy trình chăm sóc khách hàng.
        </p>
        <div className="features-container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <AIIcon />
              </div>
              <h3 className="feature-title">Trí tuệ nhân tạo</h3>
              <p className="feature-description">
                Sử dụng công nghệ AI tiên tiến để hiểu và phản hồi các yêu cầu của khách hàng một cách chính xác và tự nhiên.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <SupportIcon />
              </div>
              <h3 className="feature-title">Hỗ trợ 24/7</h3>
              <p className="feature-description">
                Trợ lý ảo của bạn luôn sẵn sàng phục vụ và hỗ trợ khách hàng mọi lúc, mọi nơi, không có ngày nghỉ.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <IntegrationIcon />
              </div>
              <h3 className="feature-title">Tích hợp đơn giản</h3>
              <p className="feature-description">
                Quy trình tích hợp đơn giản, nhanh chóng và không đòi hỏi nhiều kiến thức kỹ thuật chuyên sâu.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <SecurityIcon />
              </div>
              <h3 className="feature-title">Bảo mật cao</h3>
              <p className="feature-description">
                Đảm bảo an toàn thông tin với các biện pháp bảo mật tiên tiến, bảo vệ dữ liệu của bạn và khách hàng.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <AnalyticsIcon />
              </div>
              <h3 className="feature-title">Phân tích dữ liệu</h3>
              <p className="feature-description">
                Theo dõi và phân tích tương tác của khách hàng để cải thiện dịch vụ và chiến lược kinh doanh.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <LanguageIcon />
              </div>
              <h3 className="feature-title">Hỗ trợ tiếng Việt</h3>
              <p className="feature-description">
                Trợ lý ảo hiểu và giao tiếp bằng tiếng Việt một cách tự nhiên, phù hợp với thị trường Việt Nam.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-container">
          <h2 className="cta-title">Sẵn sàng nâng cao trải nghiệm khách hàng?</h2>
          <p className="cta-description">
            Hãy bắt đầu trải nghiệm trợ lý ảo AI ngay hôm nay và khám phá cách nó có thể 
            giúp doanh nghiệp của bạn phát triển.
          </p>
          <div className="cta-buttons">
            <button className="cta-btn-primary" onClick={handleTryFreeClick}>Dùng thử miễn phí</button>
            <button className="cta-btn-secondary">Liên hệ với chúng tôi</button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Home; 