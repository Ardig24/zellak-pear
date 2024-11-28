import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Products from './pages/Products';
import AdminPanel from './pages/AdminPanel';
import NewOrderHistory from './pages/NewOrderHistory';
import { useAuth } from './contexts/AuthContext';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { currentUser, userData } = useAuth();
  
  if (!currentUser) return <Navigate to="/login" />;
  if (adminOnly && !userData?.isAdmin) return <Navigate to="/products" />;
  
  return <>{children}</>;
}

function App() {
  return (
    <div className="min-h-screen bg-orange-50">
      <Routes>
        <Route path="/" element={<Navigate to="/products" />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <NewOrderHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute adminOnly>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;