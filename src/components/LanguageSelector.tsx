import React from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={() => i18n.changeLanguage('de')}
        className={`px-2 py-1 rounded ${
          i18n.language === 'de'
            ? 'bg-orange-600 text-white'
            : 'text-gray-600 hover:bg-orange-100'
        }`}
      >
        DE
      </button>
      <span className="text-gray-400">|</span>
      <button
        onClick={() => i18n.changeLanguage('sq')}
        className={`px-2 py-1 rounded ${
          i18n.language === 'sq'
            ? 'bg-orange-600 text-white'
            : 'text-gray-600 hover:bg-orange-100'
        }`}
      >
        AL
      </button>
      <span className="text-gray-400">|</span>
      <button
        onClick={() => i18n.changeLanguage('en')}
        className={`px-2 py-1 rounded ${
          i18n.language === 'en'
            ? 'bg-orange-600 text-white'
            : 'text-gray-600 hover:bg-orange-100'
        }`}
      >
        EN
      </button>
    </div>
  );
}