import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const UpdateNotification = () => {
  const [showReloadNotification, setShowReloadNotification] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Check if service worker is supported
    if ('serviceWorker' in navigator) {
      // Listen for new service worker installation
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // New service worker has taken control, reload the page
        window.location.reload();
      });

      // Check for updates every 5 minutes
      const checkForUpdates = () => {
        navigator.serviceWorker.ready.then(registration => {
          registration.update();
        });
      };

      const interval = setInterval(checkForUpdates, 5 * 60 * 1000);
      checkForUpdates(); // Initial check

      // Listen for new service worker installation
      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowReloadNotification(true);
              }
            });
          }
        });
      });

      return () => clearInterval(interval);
    }
  }, []);

  const handleReload = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.waiting?.postMessage('skipWaiting');
      });
    }
  };

  if (!showReloadNotification) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-4">
      <span>{t('app.newVersion')}</span>
      <button
        onClick={handleReload}
        className="bg-white text-blue-600 px-4 py-1 rounded-md hover:bg-blue-50 transition-colors"
      >
        {t('app.reload')}
      </button>
    </div>
  );
};

export default UpdateNotification;
