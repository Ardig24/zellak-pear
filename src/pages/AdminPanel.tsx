import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, Users, Coffee, LogOut, FileText, ShoppingBag as ShoppingBagIcon, Bell, Tag, Building2, Percent } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import Home from './admin/Home';
import ManageUsers from './admin/ManageUsers';
import ManageProducts from './admin/ManageProducts';
import ManageOrders from './admin/ManageOrders';
import ManageCategories from './admin/ManageCategories';
import Reports from '../components/Reports';
import LanguageSelector from '../components/LanguageSelector';
import { useAuth } from '../contexts/AuthContext';
import CompanyInfo from './admin/CompanyInfo';
import ManageDiscounts from './admin/ManageDiscounts';

export default function AdminPanel() {
  const { logout } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [newOrders, setNewOrders] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Memoize the orders query
  const ordersQuery = useMemo(() => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return query(
      collection(db, 'orders'),
      where('status', '==', 'pending'),
      where('orderDate', '>=', yesterday.toISOString())
    );
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      if (!isSubscribed) return;
      
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setNewOrders(orders);
      
      // Trigger animation when new orders arrive
      if (orders.length > 0) {
        setHasNewNotification(true);
        const timer = setTimeout(() => {
          if (isSubscribed) {
            setHasNewNotification(false);
          }
        }, 1000);
        return () => clearTimeout(timer);
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [ordersQuery]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout]);

  // Memoize mesh gradient style
  const meshGradientStyle = useMemo(() => ({
    backgroundImage: `
      radial-gradient(at 40% 20%, hsla(210, 100%, 93%, 1) 0px, transparent 50%),
      radial-gradient(at 80% 0%, hsla(189, 100%, 91%, 1) 0px, transparent 50%),
      radial-gradient(at 0% 50%, hsla(355, 100%, 93%, 1) 0px, transparent 50%),
      radial-gradient(at 80% 50%, hsla(240, 100%, 91%, 1) 0px, transparent 50%),
      radial-gradient(at 0% 100%, hsla(22, 100%, 92%, 1) 0px, transparent 50%),
      radial-gradient(at 80% 100%, hsla(242, 100%, 91%, 1) 0px, transparent 50%),
      radial-gradient(at 0% 0%, hsla(343, 100%, 92%, 1) 0px, transparent 50%)
    `,
    backgroundColor: '#f1f5f9',
    willChange: 'transform',
    transform: 'translateZ(0)'
  }), []);

  return (
    <div className="min-h-screen app-page">
      <div className="flex h-screen overflow-hidden" style={meshGradientStyle}>
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50">
          <div className="backdrop-blur-md bg-white/70 border-b border-white/20 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-white/20 transition-all duration-200"
              >
                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-800">{t('admin.title')}</h1>
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg hover:bg-white/20 transition-all duration-200"
                >
                  <Bell className={`w-6 h-6 ${hasNewNotification ? 'text-blue-600' : 'text-gray-600'}`} />
                  {newOrders.length > 0 && (
                    <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {newOrders.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 bg-white/90 backdrop-blur-lg shadow-xl transform transition-transform duration-200 ease-in-out">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-gray-800">{t('admin.title')}</h1>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/20 transition-all duration-200"
                  >
                    <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mb-6">
                  <LanguageSelector />
                </div>
                <nav className="space-y-2">
                  {/* Mobile Navigation Links */}
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-start px-4 py-3 rounded-lg transition-all duration-200 ${
                      location.pathname === '/admin' || location.pathname === '/admin/'
                        ? 'bg-blue-600/10 text-blue-600'
                        : 'text-gray-600 hover:bg-blue-600/5 hover:text-blue-600'
                    }`}
                  >
                    <HomeIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <div className="break-words">{t('admin.home')}</div>
                  </Link>
                  <Link
                    to="/admin/users"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-start px-4 py-3 rounded-lg transition-all duration-200 ${
                      location.pathname.includes('/admin/users')
                        ? 'bg-blue-600/10 text-blue-600'
                        : 'text-gray-600 hover:bg-blue-600/5 hover:text-blue-600'
                    }`}
                  >
                    <Users className="w-5 h-5 mr-3 flex-shrink-0" />
                    <div className="break-words">{t('admin.manageUsers')}</div>
                  </Link>
                  <Link
                    to="/admin/products"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-start px-4 py-3 rounded-lg transition-all duration-200 ${
                      location.pathname.includes('/admin/products')
                        ? 'bg-blue-600/10 text-blue-600'
                        : 'text-gray-600 hover:bg-blue-600/5 hover:text-blue-600'
                    }`}
                  >
                    <Coffee className="w-5 h-5 mr-3 flex-shrink-0" />
                    <div className="break-words">{t('admin.manageProducts')}</div>
                  </Link>
                  <Link
                    to="/admin/categories"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-start px-4 py-3 rounded-lg transition-all duration-200 ${
                      location.pathname.includes('/admin/categories')
                        ? 'bg-blue-600/10 text-blue-600'
                        : 'text-gray-600 hover:bg-blue-600/5 hover:text-blue-600'
                    }`}
                  >
                    <Tag className="w-5 h-5 mr-3 flex-shrink-0" />
                    <div className="break-words">{t('admin.manageCategories')}</div>
                  </Link>
                  <Link
                    to="/admin/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-start px-4 py-3 rounded-lg transition-all duration-200 ${
                      location.pathname.includes('/admin/orders')
                        ? 'bg-blue-600/10 text-blue-600'
                        : 'text-gray-600 hover:bg-blue-600/5 hover:text-blue-600'
                    }`}
                  >
                    <ShoppingBagIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <div className="break-words">{t('admin.manageOrders')}</div>
                  </Link>
                  <Link
                    to="/admin/reports"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-start px-4 py-3 rounded-lg transition-all duration-200 ${
                      location.pathname.includes('/admin/reports')
                        ? 'bg-blue-600/10 text-blue-600'
                        : 'text-gray-600 hover:bg-blue-600/5 hover:text-blue-600'
                    }`}
                  >
                    <FileText className="w-5 h-5 mr-3 flex-shrink-0" />
                    <div className="break-words">{t('admin.reports')}</div>
                  </Link>
                  <Link
                    to="/admin/company-info"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-start px-4 py-3 rounded-lg transition-all duration-200 ${
                      location.pathname.includes('/admin/company-info')
                        ? 'bg-blue-600/10 text-blue-600'
                        : 'text-gray-600 hover:bg-blue-600/5 hover:text-blue-600'
                    }`}
                  >
                    <Building2 className="w-5 h-5 mr-3 flex-shrink-0" />
                    <div className="break-words">{t('adminPanel.companyInfo')}</div>
                  </Link>
                  <Link
                    to="/admin/discounts"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-start px-4 py-3 rounded-lg transition-all duration-200 ${
                      location.pathname.includes('/admin/discounts')
                        ? 'bg-blue-600/10 text-blue-600'
                        : 'text-gray-600 hover:bg-blue-600/5 hover:text-blue-600'
                    }`}
                  >
                    <Percent className="w-5 h-5 mr-3 flex-shrink-0" />
                    <div className="break-words">{t('admin.manageDiscounts')}</div>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200"
                  >
                    <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
                    {t('auth.logout')}
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Notification Icon */}
        <div className="hidden lg:block fixed top-4 right-4 z-50">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-white/20 transition-all duration-200 backdrop-blur-md bg-white/70 border border-white/20 shadow-lg"
          >
            <Bell className={`w-6 h-6 ${hasNewNotification ? 'text-blue-600' : 'text-gray-600'}`} />
            {newOrders.length > 0 && (
              <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {newOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-72 flex-shrink-0 h-full overflow-y-auto">
          <div className={`backdrop-blur-md bg-white/70 rounded-xl p-6 mx-4 mt-16 sticky top-16 border border-white/20 shadow-lg ${i18n.language === 'sq' ? '' : 'pb-24'}`}>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('admin.title')}</h1>
            <div className="px-4 mt-6 mb-6">
              <LanguageSelector />
            </div>
            <nav className="space-y-2">
              <Link
                to="/admin"
                className={`flex items-start px-4 py-3 rounded-lg transition-all duration-200 ${
                  location.pathname === '/admin' || location.pathname === '/admin/'
                    ? 'bg-indigo-600/10 text-indigo-600'
                    : 'text-gray-600 hover:bg-indigo-600/5 hover:text-indigo-600'
                }`}
              >
                <HomeIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                <div className="break-words">{t('admin.home')}</div>
              </Link>
              <Link
                to="/admin/users"
                className={`flex items-start px-4 py-3 rounded-lg transition-all duration-200 ${
                  location.pathname.includes('/admin/users')
                    ? 'bg-indigo-600/10 text-indigo-600'
                    : 'text-gray-600 hover:bg-indigo-600/5 hover:text-indigo-600'
                }`}
              >
                <Users className="w-5 h-5 mr-3 flex-shrink-0" />
                <div className="break-words">{t('admin.manageUsers')}</div>
              </Link>
              <Link
                to="/admin/products"
                className={`flex items-start px-4 py-3 rounded-lg transition-all duration-200 ${
                  location.pathname.includes('/admin/products')
                    ? 'bg-indigo-600/10 text-indigo-600'
                    : 'text-gray-600 hover:bg-indigo-600/5 hover:text-indigo-600'
                }`}
              >
                <Coffee className="w-5 h-5 mr-3 flex-shrink-0" />
                <div className="break-words">{t('admin.manageProducts')}</div>
              </Link>
              <Link
                to="/admin/categories"
                className={`flex items-start px-4 py-3 rounded-lg transition-all duration-200 ${
                  location.pathname.includes('/admin/categories')
                    ? 'bg-indigo-600/10 text-indigo-600'
                    : 'text-gray-600 hover:bg-indigo-600/5 hover:text-indigo-600'
                }`}
              >
                <Tag className="w-5 h-5 mr-3 flex-shrink-0" />
                <div className="break-words">{t('admin.manageCategories')}</div>
              </Link>
              <Link
                to="/admin/orders"
                className={`flex items-start px-4 py-3 rounded-lg transition-all duration-200 ${
                  location.pathname.includes('/admin/orders')
                    ? 'bg-indigo-600/10 text-indigo-600'
                    : 'text-gray-600 hover:bg-indigo-600/5 hover:text-indigo-600'
                }`}
              >
                <ShoppingBagIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                <div className="break-words">{t('admin.manageOrders')}</div>
              </Link>
              <Link
                to="/admin/reports"
                className={`flex items-start px-4 py-3 rounded-lg transition-all duration-200 ${
                  location.pathname.includes('/admin/reports')
                    ? 'bg-indigo-600/10 text-indigo-600'
                    : 'text-gray-600 hover:bg-indigo-600/5 hover:text-indigo-600'
                }`}
              >
                <FileText className="w-5 h-5 mr-3 flex-shrink-0" />
                <div className="break-words">{t('admin.reports')}</div>
              </Link>
              <Link
                to="/admin/company-info"
                className={`flex items-start px-4 py-3 rounded-lg transition-all duration-200 ${
                  location.pathname.includes('/admin/company-info')
                    ? 'bg-indigo-600/10 text-indigo-600'
                    : 'text-gray-600 hover:bg-indigo-600/5 hover:text-indigo-600'
                }`}
              >
                <Building2 className="w-5 h-5 mr-3 flex-shrink-0" />
                <div className="break-words">{t('adminPanel.companyInfo')}</div>
              </Link>
              <Link
                to="/admin/discounts"
                className={`flex items-start px-4 py-3 rounded-lg transition-all duration-200 ${
                  location.pathname.includes('/admin/discounts')
                    ? 'bg-indigo-600/10 text-indigo-600'
                    : 'text-gray-600 hover:bg-indigo-600/5 hover:text-indigo-600'
                }`}
              >
                <Percent className="w-5 h-5 mr-3 flex-shrink-0" />
                <div className="break-words">{t('admin.manageDiscounts')}</div>
              </Link>
            </nav>
            <div className="px-4 mt-6">
              <button
                onClick={handleLogout}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t('auth.logout')}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
          <div className="container mx-auto p-4">
            {/* Notification Panel */}
            {showNotifications && (
              <div className="fixed right-4 mt-2 w-80 backdrop-blur-md bg-white/70 rounded-lg shadow-lg border border-white/20 z-50 lg:top-16 top-16">
                <div className="p-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">
                    {t('admin.notifications.newOrders')}
                  </h3>
                </div>
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                  {newOrders.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500 text-center">
                      {t('admin.notifications.noNewOrders')}
                    </div>
                  ) : (
                    newOrders.map((order) => (
                      <Link
                        key={order.id}
                        to="/admin/orders"
                        className="block p-4 hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
                        onClick={() => setShowNotifications(false)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {order.companyName}
                            </p>
                            <p className="text-xs text-gray-500">
                              €{order.total.toFixed(2)}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(order.orderDate).toLocaleDateString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                {newOrders.length > 0 && (
                  <Link
                    to="/admin/orders"
                    className="block p-3 text-center text-sm text-indigo-600 hover:bg-gray-50 border-t border-gray-200"
                    onClick={() => setShowNotifications(false)}
                  >
                    {t('admin.notifications.viewAll')}
                  </Link>
                )}
              </div>
            )}
            <Routes>
              <Route index element={<Home />} />
              <Route path="/users" element={<ManageUsers />} />
              <Route path="/products" element={<ManageProducts />} />
              <Route path="/categories" element={<ManageCategories />} />
              <Route path="/orders" element={<ManageOrders />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/company-info" element={<CompanyInfo />} />
              <Route path="/discounts" element={<ManageDiscounts />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}