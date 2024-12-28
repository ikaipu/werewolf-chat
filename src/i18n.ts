import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useStore } from './store/useStore';

import en from './locales/en.json';
import ja from './locales/ja.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ja: { translation: ja }
    },
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// Sync i18n language changes with store
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
  useStore.getState().setLanguage(lng);
});

export default i18n;
