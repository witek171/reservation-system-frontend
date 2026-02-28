import React from 'react';
import { useI18n } from '@/context/I18nContext.tsx';

interface AvailabilityHeaderProps {
  weekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  availabilitiesInWeek: number;
  totalAvailabilities: number;
}

function formatWeekRange(weekStart: Date, localeTag: string): string {
  const mon = weekStart;
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  return `${mon.toLocaleDateString(localeTag, opts)} – ${sun.toLocaleDateString(localeTag, opts)}`;
}

const AvailabilityHeader: React.FC<AvailabilityHeaderProps> = ({
  weekStart,
  onPrevWeek,
  onNextWeek,
  onToday,
  availabilitiesInWeek: _availabilitiesInWeek,
  totalAvailabilities: _totalAvailabilities,
}) => {
  const { t, locale } = useI18n();
  const localeTag = locale === 'pl' ? 'pl-PL' : 'en-GB';
  return (
    <header className="px-5 py-[1.17rem] border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/50">
      <div className="flex flex-wrap justify-between items-center gap-6">
        <div className="flex flex-wrap items-center gap-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 m-0 tracking-tight whitespace-nowrap">
            {formatWeekRange(weekStart, localeTag)}
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onToday}
            className="rounded-xl border border-primary-300 bg-primary-500/15 px-4 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-500/25 dark:border-primary-600 dark:bg-primary-500/20 dark:text-primary-200 dark:hover:bg-primary-500/30 transition-colors cursor-pointer"
            title={t('availability.thisWeekButton')}
          >
            {t('availability.thisWeekButton')}
          </button>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <button
              onClick={onPrevWeek}
              className="flex items-center justify-center w-8 h-8 rounded-md bg-transparent text-zinc-500 hover:bg-white hover:text-primary-600 dark:hover:bg-zinc-700 dark:hover:text-primary-400 cursor-pointer transition-colors shadow-sm"
              aria-label={t('availability.prevWeek')}
              title={t('availability.prevWeek')}
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={onNextWeek}
              className="flex items-center justify-center w-8 h-8 rounded-md bg-transparent text-zinc-500 hover:bg-white hover:text-primary-600 dark:hover:bg-zinc-700 dark:hover:text-primary-400 cursor-pointer transition-colors shadow-sm"
              aria-label={t('availability.nextWeek')}
              title={t('availability.nextWeek')}
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AvailabilityHeader;
