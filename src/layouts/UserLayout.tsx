// src/layouts/UserLayout.tsx
import React from 'react';
import Products from '../pages/Products';
import { useAuth } from '../contexts/AuthContext';
import LanguageSelector from '../components/LanguageSelector';
import { useTranslation } from 'react-i18next';

function UserLayout() {
  const { logout } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      {/* Only keep this navigation bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-gray-800">
              {t('menuCategories')}
            </h1>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <button
                onClick={logout}
                className="px-4 py-2 text-sm text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors duration-200"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Products />
      </main>
    </div>
  );
}

export default UserLayout;
