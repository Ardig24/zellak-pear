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
      <div className="container mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
        {/* Sidebar for desktop / Bottom nav for mobile */}
        <div className="order-2 lg:order-1 lg:w-64">
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg border-t border-gray-200 z-50">
            <nav className="flex justify-around p-2">
              <Link
                to="/admin/users"
                className={`flex flex-col items-center p-2 rounded-lg ${
                  location.pathname.includes('/users') 
                    ? 'text-indigo-600' 
                    : 'text-gray-700'
                }`}
              >
                <Users className="w-6 h-6" />
                <span className="text-xs mt-1">{t('admin.users')}</span>
              </Link>
              <Link
                to="/admin/products"
                className={`flex flex-col items-center p-2 rounded-lg ${
                  location.pathname.includes('/products')
                    ? 'text-indigo-600'
                    : 'text-gray-700'
                }`}
              >
                <Coffee className="w-6 h-6" />
                <span className="text-xs mt-1">{t('admin.products')}</span>
              </Link>
              <Link
                to="/admin/orders"
                className={`flex flex-col items-center p-2 rounded-lg ${
                  location.pathname.includes('/orders')
                    ? 'text-indigo-600'
                    : 'text-gray-700'
                }`}
              >
                <ShoppingBag className="w-6 h-6" />
                <span className="text-xs mt-1">{t('admin.orders')}</span>
              </Link>
              <Link
                to="/admin/reports"
                className={`flex flex-col items-center p-2 rounded-lg ${
                  location.pathname.includes('/reports')
                    ? 'text-indigo-600'
                    : 'text-gray-700'
                }`}
              >
                <FileText className="w-6 h-6" />
                <span className="text-xs mt-1">{t('admin.reports')}</span>
              </Link>
            </nav>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block glass-panel rounded-xl sticky top-6">
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
        </div>

        {/* Main Content */}
        <div className="order-1 lg:order-2 flex-1 glass-panel rounded-xl p-4 sm:p-6 lg:p-8 mb-16 lg:mb-0">
          {/* Top bar for mobile */}
          <div className="lg:hidden flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold text-gray-800">{t('admin.title')}</h1>
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <button
                onClick={handleLogout}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          <Routes>
            <Route path="/users" element={<ManageUsers />} />
            <Route path="/products" element={<ManageProducts />} />
            <Route path="/orders" element={<ManageOrders />} />
            <Route path="/reports" element={<Reports />} />
            <Route
              path="/"
              element={
                <div className="text-center mt-10 lg:mt-20">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
                    {t('admin.welcome')}
                  </h2>
                  <p className="text-gray-600 text-base sm:text-lg">
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