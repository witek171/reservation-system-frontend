import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../context/I18nContext.tsx';
import { extractErrorMessage } from '../utils/errorUtils.ts';

const demoAccounts = [
  { role: 'Manager', email: 'm@m.pl', password: 'demo' },
  { role: 'Trainer', email: 't@t.pl', password: 'demo' },
  { role: 'Reception', email: 'r@r.pl', password: 'demo' },
];

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
      setPassword(location.state.password);
    }
  }, [location.state]);

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
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8 sm:p-gutter">
      <main className="w-full max-w-[420px] bg-surface-container-lowest rounded-2xl border border-surface-container-highest shadow-sm p-4 sm:p-lg flex flex-col">

        <div className="flex flex-col items-center justify-center mb-lg">
          <h1 className="font-h1 text-h1 text-primary">Bookium</h1>
        </div>

        {error && (
          <div className="mb-md p-sm rounded-xl bg-error-container text-error font-body-sm text-body-sm">
            {error}
          </div>
        )}

        {/* Tabela demo */}
        <div className="bg-surface-container-low rounded-xl p-3 sm:p-sm mb-lg border border-surface-variant">
          <span className="block mb-sm font-label-bold text-label-bold text-on-surface">
            {t('auth.demoIntro')}
          </span>

          <div className="overflow-x-auto rounded-lg">
            <table className="w-full border-collapse">
              <thead>
              <tr className="border-b border-surface-variant">
                <th className="py-1 sm:py-xs pr-2 sm:pr-sm text-left font-label-bold text-label-bold text-on-surface text-xs sm:text-sm">
                  Rola
                </th>
                <th className="py-1 sm:py-xs pr-2 sm:pr-sm text-left font-label-bold text-label-bold text-on-surface text-xs sm:text-sm">
                  Email
                </th>
                <th className="py-1 sm:py-xs text-left font-label-bold text-label-bold text-on-surface text-xs sm:text-sm">
                  Hasło
                </th>
              </tr>
              </thead>

              <tbody>
              {demoAccounts.map((account) => (
                <tr
                  key={account.email}
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(account.password);
                  }}
                  className="border-b border-surface-variant last:border-b-0 cursor-pointer hover:bg-surface active:bg-surface-variant transition-colors"
                >
                  <td
                    translate="no"
                    className="notranslate py-1 sm:py-xs pr-2 sm:pr-sm font-body-sm text-body-sm text-on-surface-variant text-xs sm:text-sm"
                  >
                    {account.role}
                  </td>

                  <td className="py-1 sm:py-xs pr-2 sm:pr-sm">
                    <code
                      translate="no"
                      className="notranslate text-on-surface-variant text-xs sm:text-sm"
                    >
                      {account.email}
                    </code>
                  </td>

                  <td className="py-1 sm:py-xs">
                    <code
                      translate="no"
                      className="notranslate text-on-surface-variant text-xs sm:text-sm"
                    >
                      {account.password}
                    </code>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>

          {/* Podpowiedź dotykowa widoczna tylko na mobile */}
          <p className="mt-2 text-xs text-on-surface-variant opacity-60 sm:hidden">
            Kliknij wiersz aby załadować dane
          </p>
        </div>

        {/* Formularz */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label
              className="font-label-bold text-label-bold text-on-surface-variant"
              htmlFor="email"
            >
              {t('auth.email')}
            </label>
            <input
              type="email"
              id="email"
              className="h-[48px] w-full bg-surface border border-outline-variant rounded-lg px-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-surface-tint"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="twoj@email.pl"
              autoComplete="email"
              required
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label
              className="font-label-bold text-label-bold text-on-surface-variant"
              htmlFor="password"
            >
              {t('auth.password')}
            </label>
            <input
              type="password"
              id="password"
              className="h-[48px] w-full bg-surface border border-outline-variant rounded-lg px-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-surface-tint"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-sm h-[48px] w-full bg-secondary text-on-secondary font-label-bold text-label-bold rounded-lg flex items-center justify-center hover:bg-on-secondary-fixed-variant active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </form>

        <div className="mt-md pt-md border-t border-surface-variant">
          <button
            type="button"
            onClick={() => {
              setEmail('m@m.pl');
              setPassword('demo');
            }}
            className="w-full py-sm px-md bg-surface text-secondary font-label-bold text-label-bold rounded-lg hover:bg-surface-container-low active:scale-[0.98] transition-all"
          >
            Załaduj dane demo
          </button>
        </div>

      </main>
    </div>
  );
};

export default LoginPage;