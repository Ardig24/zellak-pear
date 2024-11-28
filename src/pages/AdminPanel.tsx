import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Users, Coffee, LogOut, FileText, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ManageUsers from './admin/ManageUsers';
import ManageProducts from './admin/ManageProducts';
import ManageOrders from './admin/ManageOrders';
import Reports from '../components/Reports';
import LanguageSelector from '../components/LanguageSelector';
import { useAuth } from '../contexts/AuthContext';

export default function AdminPanel() {
  const { logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen app-page">
      <div className="container mx-auto flex gap-6 p-6">
        {/* Sidebar */}
        <div className="w-64 glass-panel rounded-xl">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('admin.title')}</h1>
            <div className="mb-6">
              <LanguageSelector />
            </div>
          </div>
          <nav className="px-2">
            <Link
              to="/admin/users"
              className={`flex items-center px-4 py-3 mb-2 rounded-lg transition-all duration-200 ${
                location.pathname.includes('/users') 
                  ? 'bg-indigo-600/90 text-white' 
                  : 'text-gray-700 hover:bg-white/50'
              }`}
            >
              <Users className="w-5 h-5 mr-3" />
              {t('admin.manageUsers')}
            </Link>
            <Link
              to="/admin/products"
              className={`flex items-center px-4 py-3 mb-2 rounded-lg transition-all duration-200 ${
                location.pathname.includes('/products')
                  ? 'bg-indigo-600/90 text-white'
                  : 'text-gray-700 hover:bg-white/50'
              }`}
            >
              <Coffee className="w-5 h-5 mr-3" />
              {t('admin.manageProducts')}
            </Link>
            <Link
              to="/admin/orders"
              className={`flex items-center px-4 py-3 mb-2 rounded-lg transition-all duration-200 ${
                location.pathname.includes('/orders')
                  ? 'bg-indigo-600/90 text-white'
                  : 'text-gray-700 hover:bg-white/50'
              }`}
            >
              <ShoppingBag className="w-5 h-5 mr-3" />
              {t('admin.manageOrders')}
            </Link>
            <Link
              to="/admin/reports"
              className={`flex items-center px-4 py-3 mb-2 rounded-lg transition-all duration-200 ${
                location.pathname.includes('/reports')
                  ? 'bg-indigo-600/90 text-white'
                  : 'text-gray-700 hover:bg-white/50'
              }`}
            >
              <FileText className="w-5 h-5 mr-3" />
              {t('admin.reports')}
            </Link>
            <div className="px-2 py-4">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
              >
                <LogOut className="w-5 h-5 mr-3" />
                {t('admin.logout')}
              </button>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 glass-panel rounded-xl p-8">
          <Routes>
            <Route path="/users" element={<ManageUsers />} />
            <Route path="/products" element={<ManageProducts />} />
            <Route path="/orders" element={<ManageOrders />} />
            <Route path="/reports" element={<Reports />} />
            <Route
              path="/"
              element={
                <div className="text-center mt-20">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">
                    {t('admin.welcome')}
                  </h2>
                  <p className="text-gray-600 text-lg">
                    {t('admin.selectSection')}
                  </p>
                </div>
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}