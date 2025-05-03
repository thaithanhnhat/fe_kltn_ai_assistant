import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import ShopConfig from '../pages/ShopConfig';
import TokensManagement from '../pages/TokensManagement';
import PrivateRoute from './PrivateRoute';
import PaymentResult from '../pages/PaymentResult';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      
      <Route path="/shop/:shopId/config" element={
        <PrivateRoute>
          <ShopConfig />
        </PrivateRoute>
      } />
      
      <Route path="/shop/:shopId/tokens" element={
        <PrivateRoute>
          <TokensManagement />
        </PrivateRoute>
      } />
      
      {/* Payment result route */}
      <Route path="/payment/result" element={
        <PrivateRoute>
          <PaymentResult />
        </PrivateRoute>
      } />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes; 