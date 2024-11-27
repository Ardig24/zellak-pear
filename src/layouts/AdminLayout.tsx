// src/layouts/AdminLayout.tsx
import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import ManageProducts from '../pages/admin/ManageProducts';
import ManageUsers from '../pages/admin/ManageUsers';
import Reports from '../components/Reports';

function AdminLayout() {
  const location = useLocation();
  const { t } = useTranslation();
  const { logout } = useAuth();

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="w-64 min-h-screen bg-white shadow-lg">
        <div className="p-6 flex flex-col">
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
            Manage Products
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
            Manage Users
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
            Reports
          </Link>
          
          {/* Logout Button at the bottom of sidebar */}
          <div className="absolute bottom-0 w-64 p-4 border-t">
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-2 text-sm text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors duration-200"
            >
              <span className="material-icons mr-2">logout</span>
              Logout
            </button>
          </div>
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

export default AdminLayout;
