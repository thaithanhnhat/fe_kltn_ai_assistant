import { RouterProvider } from 'react-router-dom'
import { useState, useEffect } from 'react'
import router from './routes/routes'
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const [error, setError] = useState(null);

  // Xử lý lỗi toàn cục
  useEffect(() => {
    const handleError = (event) => {
      console.error('Lỗi ứng dụng:', event.error);
      setError(event.error?.message || 'Đã xảy ra lỗi không xác định');
      
      // Xóa thông báo lỗi sau 5 giây
      setTimeout(() => setError(null), 5000);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <AuthProvider>
      {error && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#f44336',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '4px',
          zIndex: 9999,
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}>
          {error}
        </div>
      )}
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App