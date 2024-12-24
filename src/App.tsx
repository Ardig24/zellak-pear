import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Products from './pages/Products';
import AdminPanel from './pages/AdminPanel';
import NewOrderHistory from './pages/NewOrderHistory';
import { useAuth } from './contexts/AuthContext';
import UpdateNotification from './components/UpdateNotification';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { currentUser, userData } = useAuth();
  
  if (!currentUser) return <Navigate to="/login" />;
  if (adminOnly && !userData?.isAdmin) return <Navigate to="/products" />;
  
  return <>{children}</>;
}

function App() {
  return (
    <>
      <UpdateNotification />
      <div className="min-h-screen bg-orange-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/products/*"
            element={
              <ProtectedRoute>
                <Products />
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
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <NewOrderHistory />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/products" />} />
        </Routes>
      </div>
    </>
  );
}

export default App;