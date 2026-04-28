import React from 'react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useI18n } from '../../../context/I18nContext.tsx';

interface ReservationHeaderProps {
  totalCount: number;
  showForm: boolean;
  onToggleForm: () => void;
}

const ReservationHeader: React.FC<ReservationHeaderProps> = ({
                                                               totalCount,
                                                               showForm,
                                                               onToggleForm,
                                                             }) => {
  const { t } = useI18n();
  const { isTrainer } = useAuth();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-h2 text-h2 text-on-surface">{t('reservations.title')}</h1>

          {totalCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-surface-container-low border border-outline-variant px-3 py-1 font-body-sm text-body-sm text-on-surface-variant">
              {totalCount === 1
                ? t('reservations.reservationCount', { count: totalCount })
                : t('reservations.reservationsCount', { count: totalCount })}
            </span>
          )}
        </div>

        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          {t('reservations.subtitle')}
        </p>
      </div>

      {!isTrainer() && (
        <button
          type="button"
          onClick={onToggleForm}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-label-bold text-label-bold transition-colors ${
            showForm
              ? 'border border-outline-variant text-on-surface hover:bg-surface-container-low'
              : 'bg-primary text-on-primary hover:bg-primary-hover'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {showForm ? 'close' : 'add'}
          </span>
          {showForm ? t('common.cancel') : t('reservations.add')}
        </button>
      )}
    </div>
  );
};

export default ReservationHeader;