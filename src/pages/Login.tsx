import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, clearError, loading } = useAuth();
  const { t } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (error) {
      // Error is handled by the AuthContext
    }
  };

  return (
    <div className="login-page min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Language selector moved to top right */}
      <div className="absolute top-4 right-4">
        <div className="bg-white/30 backdrop-blur-md rounded-lg p-2 shadow-lg">
          <LanguageSelector />
        </div>
      </div>

      <div className="card max-w-md w-full bg-white/30 backdrop-blur-md shadow-2xl border border-white/50">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white drop-shadow-lg">
            {t('login.title')}
          </h2>
          <p className="mt-3 text-lg text-white/90 drop-shadow">
            {t('login.subtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage 
              message={error} 
              onDismiss={clearError} 
            />
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-1 ml-1">
                {t('login.email')}
              </label>
              <div className="relative flex items-center">
                <div className="absolute -left-6 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="input-field bg-white/50 text-gray-900 placeholder-gray-500"
                  placeholder={t('login.email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-1 ml-1">
                {t('login.password')}
              </label>
              <div className="relative flex items-center">
                <div className="absolute -left-6 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="input-field bg-white/50 text-gray-900 placeholder-gray-500"
                  placeholder={t('login.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-lg text-white text-lg font-semibold
                bg-indigo-600/90 hover:bg-indigo-700/90 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                transition-all duration-200 ease-in-out
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <LoadingSpinner />
              ) : (
                t('login.signIn')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}