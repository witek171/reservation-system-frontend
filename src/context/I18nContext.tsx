import { createContext, useContext, type ReactNode } from 'react';
import { t } from '../i18n/translations';

interface I18nContextValue {
  t: (key: string, vars?: Record<string, string | number>) => string;
  locale: string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  return (
    <I18nContext.Provider value={{ t, locale: 'pl' }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
