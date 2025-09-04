import React, { createContext, useContext, useMemo } from 'react';
import { translations, fallbackLocale, Locale } from './translations';

interface I18nContextValue {
  locale: Locale;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const I18nProvider: React.FC<{ locale?: string; children: React.ReactNode; }> = ({ locale, children }) => {
  const resolved: Locale = (locale && (locale.startsWith('de') ? 'de' : locale.startsWith('en') ? 'en' : undefined)) || (navigator?.language?.startsWith('de') ? 'de' : 'en') || fallbackLocale;
  const value = useMemo<I18nContextValue>(() => ({
    locale: resolved,
    t: (key, vars) => {
      const catalog = translations[resolved] || translations[fallbackLocale];
      let str = catalog[key] || key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          str = str.replace(new RegExp(`{${k}}`, 'g'), String(v));
        });
      }
      return str;
    }
  }), [resolved]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
};

export const useT = () => useI18n().t;
