import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
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
      <div className="flex h-screen overflow-hidden">
        {/* Fixed width sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0 h-full overflow-y-auto">
          <div className="glass-panel rounded-xl p-6 m-4 sticky top-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('admin.title')}</h1>
            <div className="mb-6">
              <LanguageSelector />
            </div>
            <nav className="space-y-2">
              <Link
                to="/admin/users"
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
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
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
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
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
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
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                  location.pathname.includes('/reports')
                    ? 'bg-indigo-600/90 text-white'
                    : 'text-gray-700 hover:bg-white/50'
                }`}
              >
                <FileText className="w-5 h-5 mr-3" />
                {t('admin.reports')}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-3 rounded-lg w-full text-gray-700 hover:bg-white/50 transition-all duration-200"
              >
                <LogOut className="w-5 h-5 mr-3" />
                {t('admin.logout')}
              </button>
            </nav>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 min-w-0 h-full overflow-y-auto">
          {/* Mobile Bottom Navigation */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg border-t border-gray-200 z-50">
            <nav className="flex justify-around items-center px-2 py-3">
              <Link
                to="/admin/users"
                className={`flex flex-col items-center min-w-[64px] ${
                  location.pathname.includes('/users') 
                    ? 'text-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className={`w-6 h-6 ${
                  location.pathname.includes('/users') 
                    ? 'stroke-[2.5]' 
                    : 'stroke-2'
                }`} />
                <span className="text-xs mt-1 font-medium">{t('admin.users')}</span>
              </Link>
              <Link
                to="/admin/products"
                className={`flex flex-col items-center min-w-[64px] ${
                  location.pathname.includes('/products')
                    ? 'text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Coffee className={`w-6 h-6 ${
                  location.pathname.includes('/products') 
                    ? 'stroke-[2.5]' 
                    : 'stroke-2'
                }`} />
                <span className="text-xs mt-1 font-medium">{t('admin.products')}</span>
              </Link>
              <Link
                to="/admin/orders"
                className={`flex flex-col items-center min-w-[64px] ${
                  location.pathname.includes('/orders')
                    ? 'text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ShoppingBag className={`w-6 h-6 ${
                  location.pathname.includes('/orders') 
                    ? 'stroke-[2.5]' 
                    : 'stroke-2'
                }`} />
                <span className="text-xs mt-1 font-medium">{t('admin.orders')}</span>
              </Link>
              <Link
                to="/admin/reports"
                className={`flex flex-col items-center min-w-[64px] ${
                  location.pathname.includes('/reports')
                    ? 'text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className={`w-6 h-6 ${
                  location.pathname.includes('/reports') 
                    ? 'stroke-[2.5]' 
                    : 'stroke-2'
                }`} />
                <span className="text-xs mt-1 font-medium">{t('admin.reports')}</span>
              </Link>
            </nav>
          </div>

          {/* Routes */}
          <div className="p-4">
            <Routes>
              <Route path="/" element={<Navigate to="/admin/users" />} />
              <Route path="/users" element={<ManageUsers />} />
              <Route path="/products" element={<ManageProducts />} />
              <Route path="/orders" element={<ManageOrders />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}