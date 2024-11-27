// src/pages/AdminPanel.tsx
import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import ManageProducts from './admin/ManageProducts';
import ManageUsers from './admin/ManageUsers';
import Reports from '../components/Reports';
import { useTranslation } from 'react-i18next';

function AdminPanel() {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <div className="flex">
      {/* Left Sidebar Navigation */}
      <div className="w-64 min-h-screen bg-white shadow-md">
        <nav className="mt-8">
          <Link
            to="/admin/products"
            className={`block px-4 py-2 mb-2 ${
              location.pathname.includes('/products')
                ? 'bg-orange-100 text-orange-600'
                : 'text-gray-600 hover:bg-orange-50'
            }`}
          >
            {t('manageProducts')}
          </Link>
          <Link
            to="/admin/users"
            className={`block px-4 py-2 mb-2 ${
              location.pathname.includes('/users')
                ? 'bg-orange-100 text-orange-600'
                : 'text-gray-600 hover:bg-orange-50'
            }`}
          >
            {t('manageUsers')}
          </Link>
          <Link
            to="/admin/reports"
            className={`block px-4 py-2 mb-2 ${
              location.pathname.includes('/reports')
                ? 'bg-orange-100 text-orange-600'
                : 'text-gray-600 hover:bg-orange-50'
            }`}
          >
            {t('reports')}
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <Routes>
          <Route path="products" element={<ManageProducts />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="products" />} />
        </Routes>
      </div>
    </div>
  );
}

export default AdminPanel;
