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
  const [selectedId, setSelectedId] = useState<string | null>(
    companies.length === 1 ? companies[0].id : null
  );
  const { t } = useI18n();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const company = companies.find((c) => c.id === selectedId);
    if (company) onSelect(company);
  };

  const role = (staffMember as Record<string, string>)?.role ?? '';

  if (companies.length === 0) {
    return (
      <div className="bg-surface-container-low rounded-xl p-4 sm:p-sm border border-surface-variant text-center">
        <div className="mx-auto mb-sm flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-on-surface-variant">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-6 w-6"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>

        <h2 className="font-label-bold text-label-bold text-on-surface">
          {t('company.noCompanies')}
        </h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      <div className="flex items-center gap-2">
        <span className="font-body-sm text-body-sm text-on-surface-variant">
          {t('company.yourRole')}
        </span>
        <RoleBadge role={role} />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-md">
        <div className="flex flex-col gap-sm">
          {companies.map((company) => {
            const c = company as Record<string, string>;
            const isSelected = selectedId === company.id;

            return (
              <button
                key={company.id}
                type="button"
                onClick={() => setSelectedId(company.id)}
                className={`w-full rounded-xl border p-3 text-left transition-all active:scale-[0.99] ${
                  isSelected
                    ? 'border-primary bg-surface ring-1 ring-primary'
                    : 'border-surface-variant bg-surface-container-low hover:bg-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      isSelected
                        ? 'bg-secondary text-on-secondary'
                        : 'bg-surface text-on-surface-variant'
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-5 w-5"
                    >
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-label-bold text-label-bold text-on-surface truncate">
                      {company.name}
                    </h3>

                    {c.city && (
                      <p className="mt-[2px] font-body-sm text-body-sm text-on-surface-variant truncate">
                        {c.city}
                        {c.street ? `, ${c.street}` : ''}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {isSelected ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-5 w-5 text-primary"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-outline-variant" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={selectedId === null}
          className="mt-sm h-[48px] w-full bg-secondary text-on-secondary font-label-bold text-label-bold rounded-lg flex items-center justify-center gap-2 hover:bg-on-secondary-fixed-variant active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {t('company.continue')}
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default CompanySelector;