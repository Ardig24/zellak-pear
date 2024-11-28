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
    <div className="min-h-screen bg-orange-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4">
          <h1 className="text-xl font-bold text-gray-800">{t('admin.title')}</h1>
          <div className="mt-2">
            <LanguageSelector />
          </div>
        </div>
        <nav className="mt-4">
          <Link
            to="/admin/users"
            className={`flex items-center px-4 py-2 ${
              location.pathname.includes('/users') ? 'bg-orange-100 text-orange-600' : 'text-gray-700 hover:bg-orange-100'
            }`}
          >
            <Users className="w-5 h-5 mr-2" />
            {t('admin.manageUsers')}
          </Link>
          <Link
            to="/admin/products"
            className={`flex items-center px-4 py-2 ${
              location.pathname.includes('/products') ? 'bg-orange-100 text-orange-600' : 'text-gray-700 hover:bg-orange-100'
            }`}
          >
            <Coffee className="w-5 h-5 mr-2" />
            {t('admin.manageProducts')}
          </Link>
          <Link
            to="/admin/reports"
            className={`flex items-center px-4 py-2 ${
              location.pathname.includes('/reports') ? 'bg-orange-100 text-orange-600' : 'text-gray-700 hover:bg-orange-100'
            }`}
          >
            <FileText className="w-5 h-5 mr-2" />
            {t('admin.reports')}
          </Link>
          <Link
            to="/admin/orders"
            className={`flex items-center px-4 py-2 ${
              location.pathname.includes('/orders') ? 'bg-orange-100 text-orange-600' : 'text-gray-700 hover:bg-orange-100'
            }`}
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            {t('admin.manageOrders')}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5 mr-2" />
            {t('common.logout')}
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <Routes>
          <Route path="users" element={<ManageUsers />} />
          <Route path="products" element={<ManageProducts />} />
          <Route path="reports" element={<Reports />} />
          <Route path="orders" element={<ManageOrders />} />
          <Route
            path="/"
            element={
              <div className="text-center mt-20">
                <h2 className="text-2xl font-bold text-gray-800">
                  {t('admin.welcome')}
                </h2>
                <p className="text-gray-600 mt-2">
                  {t('admin.selectSection')}
                </p>
              </div>
            }
          />
        </Routes>
      </div>
    </div>
  );
}