import { useState } from 'react';
import { useI18n } from '../context/I18nContext.tsx';
import RoleBadge from './common/RoleBadge.tsx';
import type { Company, StaffMember } from '../types/api.ts';

interface CompanySelectorProps {
  companies: Company[];
  staffMember: StaffMember | null;
  onSelect: (company: Company) => void;
}

const CompanySelector = ({ companies, staffMember, onSelect }: CompanySelectorProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { t } = useI18n();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const company = companies.find((c) => c.id === selectedId);
    if (company) onSelect(company);
  };

  const firstName = (staffMember as Record<string, string>)?.firstName ?? '';
  const lastName = (staffMember as Record<string, string>)?.lastName ?? '';

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <div className="w-12 h-12 text-zinc-400 dark:text-zinc-500 mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{t('company.noCompanies')}</h4>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          {t('company.welcome')}, {firstName} {lastName}. {t('company.noCompaniesMessage')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('company.select')}</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {t('company.welcome')}, {firstName} {lastName}. {t('company.selectCompany')}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{t('company.yourRole')}</span>
        <RoleBadge role={(staffMember as Record<string, string>)?.role ?? ''} />
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          {companies.map((company) => {
            const c = company as Record<string, string>;
            const isSelected = selectedId === company.id;
            return (
              <div
                key={company.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(company.id)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedId(company.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  isSelected
                    ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{company.name}</h3>
                  {c.city && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{c.city}{c.street ? `, ${c.street}` : ''}</p>
                  )}
                </div>
                {isSelected && (
                  <div className="w-5 h-5 text-zinc-700 dark:text-zinc-300">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="submit"
          disabled={selectedId === null}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {t('company.continue')}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default CompanySelector;
