import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, clearError, loading } = useAuth();
  const { t } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
    } catch (error) {
      // Error is handled by the AuthContext
    }
  };

  return (
    <div className="login-page min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
      {/* Language selector moved to top right */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-white/30 backdrop-blur-md rounded-lg p-2 shadow-lg">
          <LanguageSelector />
        </div>
      </div>

      <div className="card w-full max-w-[90%] sm:max-w-md bg-white/30 backdrop-blur-md shadow-2xl border border-white/50 px-6 pt-32 pb-10 sm:px-8 sm:pt-40 sm:pb-14 relative">
        <div className="absolute top-0 left-0 right-0 flex justify-center z-10" style={{transform: 'translateY(-20%)'}}>
          <img src="/logo-login.png?v=1" alt="Zellak Logo" className="h-256 w-auto" />
        </div>
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
            {t('login.title')}
          </h2>
          <p className="mt-2 sm:mt-3 text-base sm:text-lg text-white/90 drop-shadow">
            {t('login.subtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-4 sm:mb-6">
            <ErrorMessage 
              message={error} 
              onDismiss={clearError} 
            />
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
          <div className="space-y-4 sm:space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white/80 border border-white/50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                placeholder="Benutzername"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-1 ml-1">
                Password
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/50 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Password"
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
              className="w-full flex justify-center py-2.5 sm:py-3 px-4 rounded-lg text-white text-base sm:text-lg font-semibold
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
