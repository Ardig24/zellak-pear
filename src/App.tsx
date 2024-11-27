import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import { useAuth } from './contexts/AuthContext';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { currentUser, userData } = useAuth();
  
  if (!currentUser) return <Navigate to="/login" />;
  if (adminOnly && !userData?.isAdmin) return <Navigate to="/products" />;
  
  return <>{children}</>;
}

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <UserLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;
