import React from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useI18n } from '../../../../context/I18nContext';
import {IconAdd, IconClose} from '../../../common/Icons/Icons';

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
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <h3 className="flex items-center gap-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100 m-0">
          {t('reservations.title')}
        </h3>
        {totalCount > 0 && (
          <span className="text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-xl">
            {totalCount === 1 ? t('reservations.reservationCount', { count: totalCount }) : t('reservations.reservationsCount', { count: totalCount })}
          </span>
        )}
      </div>
      {!isTrainer() && (
        <button
          type="button"
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
            showForm
              ? 'border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              : 'border border-primary-300 bg-primary-500/15 text-primary-700 hover:bg-primary-500/25 dark:border-primary-600 dark:bg-primary-500/20 dark:text-primary-200 dark:hover:bg-primary-500/30'
          }`}
          onClick={onToggleForm}
        >
          {showForm ? <><IconClose className="w-4 h-4" /> {t('common.cancel')}</> : <><IconAdd className="w-4 h-4" /> {t('reservations.add')}</>}
        </button>
      )}
    </div>
  );
};

export default ReservationHeader;
