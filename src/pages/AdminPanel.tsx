import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import ManageProducts from '/home/Ardig24/zellak-pear/src/pages/admin/ManageProducts.tsx';
import ManageUsers from '/home/Ardig24/zellak-pear/src/pages/admin/ManageUsers.tsx';
import Reports from '../components/Reports'; // Update the import path according to your structure
import { useTranslation } from 'react-i18next';


function AdminPanel() {
  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="w-64 min-h-screen bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-orange-600">Admin Dashboard</h1>
        </div>
        <nav className="mt-2">
          <Link
            to="/admin/products"
            className={`flex items-center px-6 py-3 mb-1 transition-colors duration-200 ${
              location.pathname.includes('/products')
                ? 'bg-orange-100 text-orange-600 border-r-4 border-orange-600'
                : 'text-gray-600 hover:bg-orange-50'
            }`}
          >
            <span className="material-icons mr-3">inventory_2</span>
            {t('manageProducts')}
          </Link>
          <Link
            to="/admin/users"
            className={`flex items-center px-6 py-3 mb-1 transition-colors duration-200 ${
              location.pathname.includes('/users')
                ? 'bg-orange-100 text-orange-600 border-r-4 border-orange-600'
                : 'text-gray-600 hover:bg-orange-50'
            }`}
          >
            <span className="material-icons mr-3">people</span>
            {t('manageUsers')}
          </Link>
          <Link
            to="/admin/reports"
            className={`flex items-center px-6 py-3 mb-1 transition-colors duration-200 ${
              location.pathname.includes('/reports')
                ? 'bg-orange-100 text-orange-600 border-r-4 border-orange-600'
                : 'text-gray-600 hover:bg-orange-50'
            }`}
          >
            <span className="material-icons mr-3">assessment</span>
            {t('reports')}
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <Routes>
            <Route path="products" element={<ManageProducts />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="reports" element={<Reports />} />
            <Route path="*" element={<Navigate to="products" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
