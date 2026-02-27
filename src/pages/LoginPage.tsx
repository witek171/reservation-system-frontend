import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { useI18n } from '../context/I18nContext.tsx';
import { extractErrorMessage } from '../utils/errorUtils.ts';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) navigate('/select-company');
      else setError(extractErrorMessage(result.error));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setLocale(locale === 'en' ? 'pl' : 'en')}
          className="px-2.5 py-1.5 rounded-md text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800"
        >
          {locale === 'en' ? 'PL' : 'EN'}
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800"
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="mb-5">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{t('auth.welcomeBack')}</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-0.5">{t('auth.signInSubtitle')}</p>
          </div>
          {error && (
            <div className="mb-4 p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t('auth.email')}
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t('auth.password')}
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {t('auth.signingIn')}
                </>
              ) : (
                <>
                  {t('auth.signIn')}
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
            {t('auth.needHelp')}{' '}
            <a href="mailto:support@planner.com" className="text-zinc-700 dark:text-zinc-300 hover:underline">
              support@planner.com
            </a>
          </p>
        </div>
        <div className="mt-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            {t('auth.demoIntro')}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-zinc-600 dark:text-zinc-400">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="py-2 pr-3 font-medium text-zinc-900 dark:text-zinc-200">{t('auth.demoRole')}</th>
                  <th className="py-2 pr-3 font-medium text-zinc-900 dark:text-zinc-200">{t('auth.demoEmail')}</th>
                  <th className="py-2 font-medium text-zinc-900 dark:text-zinc-200">{t('auth.demoPassword')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-2 pr-3">{t('role.manager')}</td>
                  <td className="py-2 pr-3 font-mono text-xs">m@m.pl</td>
                  <td className="py-2 font-mono text-xs">demo</td>
                </tr>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-2 pr-3">{t('role.trainer')}</td>
                  <td className="py-2 pr-3 font-mono text-xs">t@t.pl</td>
                  <td className="py-2 font-mono text-xs">demo</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3">{t('auth.demoRoleReception')}</td>
                  <td className="py-2 pr-3 font-mono text-xs">r@r.pl</td>
                  <td className="py-2 font-mono text-xs">demo</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            {t('auth.demoCompanyNote')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
