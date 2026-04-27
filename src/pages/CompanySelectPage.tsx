import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../context/I18nContext.tsx';
import CompanySelector from '../components/CompanySelector.tsx';
import type { Company } from '../types/api.ts';

const CompanySelectPage = () => {
  const { companies, selectCompany, hasCompanySelected, logout, loading, staffMember } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    if (hasCompanySelected) navigate('/dashboard');
  }, [hasCompanySelected, navigate]);

  const handleSelectCompany = (company: Company) => {
    selectCompany(company);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8 sm:p-gutter">
        <main className="w-full max-w-[420px] bg-surface-container-lowest rounded-2xl border border-surface-container-highest shadow-sm p-4 sm:p-lg">
          <div className="flex items-center justify-center gap-3 text-on-surface-variant font-body-md text-body-md">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
            {t('loadingCompanies')}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8 sm:p-gutter">
      <main className="w-full max-w-[520px] bg-surface-container-lowest rounded-2xl border border-surface-container-highest shadow-sm p-4 sm:p-lg flex flex-col">
        <div className="flex flex-col items-center justify-center mb-lg text-center">
          <h1 className="font-h1 text-h1 text-primary">Bookium</h1>
          <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
            Wybierz miejsce pracy, aby przejść dalej.
          </p>
        </div>

        <div className="bg-surface-container-low rounded-xl p-3 sm:p-sm mb-lg border border-surface-variant">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Przykładowe dane demo są dostępne w firmie{' '}
            <strong
              translate="no"
              className="notranslate font-label-bold text-label-bold text-on-surface"
            >
              SportFit Centrum
            </strong>
            .
          </p>
        </div>

        <CompanySelector
          companies={companies}
          staffMember={staffMember}
          onSelect={handleSelectCompany}
        />

        <div className="mt-md pt-md border-t border-surface-variant">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-sm px-md bg-surface text-secondary font-label-bold text-label-bold rounded-lg hover:bg-surface-container-low active:scale-[0.98] transition-all"
          >
            {t('nav.logout')}
          </button>
        </div>
      </main>
    </div>
  );
};

export default CompanySelectPage;