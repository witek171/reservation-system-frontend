import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import CompanySelector from '../../components/CompanySelector/CompanySelector';

const CompanySelectPage = () => {
  const { companies, selectCompany, hasCompanySelected, logout, loading, staffMember } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    if (hasCompanySelected) navigate('/dashboard');
  }, [hasCompanySelected, navigate]);

  const handleSelectCompany = (company: { id: string; name: string }) => {
    selectCompany(company);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
            <span className="w-5 h-5 border-2 border-zinc-400 dark:border-zinc-500 border-t-transparent rounded-full animate-spin" />
            {t('loadingCompanies')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center p-4">
      <div className="w-full max-w-xl flex flex-col gap-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-sm font-medium"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {t('nav.logout')}
          </button>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <CompanySelector
            companies={companies}
            staffMember={staffMember}
            onSelect={handleSelectCompany}
          />
        </div>
      </div>
    </div>
  );
};

export default CompanySelectPage;
