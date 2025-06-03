import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import VerifyEmail from '../pages/VerifyEmail';
import VerificationSuccess from '../pages/VerificationSuccess';
import VerificationFailed from '../pages/VerificationFailed';
import Dashboard from '../pages/Dashboard';
import ShopTokens from '../pages/ShopTokens';
import ShopConfig from '../pages/ShopConfig';
import PaymentResult from '../pages/PaymentResult';
import ShopProducts from '../pages/ShopProducts';
import ProductDetail from '../pages/ProductDetail';
import ShopManagement from '../pages/ShopManagement';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/verify-email',
    element: <VerifyEmail />,
  },
  {
    path: '/verification-success',
    element: <VerificationSuccess />,
  },
  {
    path: '/verification-failed',
    element: <VerificationFailed />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/shop/:shopId/tokens',
    element: <ShopTokens />,
  },
  {
    path: '/shop/:shopId/config',
    element: <ShopConfig />,
  },
  {
    path: '/payment/result',
    element: <PaymentResult />,
  },
  {
    path: '/shop/:shopId/products',
    element: <ShopProducts />,
  },
  {
    path: '/shop/:shopId/products/:productId',
    element: <ProductDetail />,
  },
  {
    path: '/shop/:shopId/management',
    element: <ShopManagement />,
  }
]);

export default router;