import React, { useState, useEffect } from 'react';
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
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);

  useEffect(() => {
    // Check if service worker is available
    if ('serviceWorker' in navigator) {
      // Add listener for new service worker
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setNewVersionAvailable(true);
      });
    }
  }, []);

  const refreshApp = () => {
    window.location.reload();
  };

  return (
    <>
      {newVersionAvailable && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white py-2 px-4 flex justify-between items-center">
          <p>A new version is available!</p>
          <button
            onClick={refreshApp}
            className="bg-white text-blue-600 px-4 py-1 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            Refresh
          </button>
        </div>
      )}
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
    </>
  );
}

export default App;