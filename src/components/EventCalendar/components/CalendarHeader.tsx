import React from 'react';
import { useI18n } from '@/context/I18nContext.tsx';
import { IconClose } from '../../common/Icons.tsx';

interface EventTypeItem {
  id: string;
  name: string;
  duration?: number;
  price?: number;
}

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  eventsCount: number;
  totalEvents: number;
  eventTypes: EventTypeItem[];
  selectedEventTypeId: string;
  onEventTypeFilter: (eventTypeId: string) => void;
  loading: boolean;
  viewMode?: 'month' | 'week';
  onViewModeChange?: (mode: 'month' | 'week') => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  eventsCount: _eventsCount,
  totalEvents: _totalEvents,
  eventTypes,
  selectedEventTypeId,
  onEventTypeFilter,
  loading,
  viewMode = 'month',
  onViewModeChange,
}) => {
  const { t, locale } = useI18n();
  const localeTag = locale === 'pl' ? 'pl-PL' : 'en-US';
  const monthLabel = currentDate.toLocaleDateString(localeTag, { month: 'long' });
  const year = currentDate.getFullYear();

  return (
    <header className="flex flex-wrap items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 gap-2">
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        <div className="relative flex-shrink-0">
          <select
            id="eventTypeFilter"
            className="appearance-none py-2 pr-8 pl-3 min-w-[140px] max-w-[220px] text-sm border border-zinc-200 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 cursor-pointer focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 disabled:opacity-60 disabled:cursor-not-allowed"
            value={selectedEventTypeId}
            onChange={(e) => onEventTypeFilter(e.target.value)}
            disabled={loading}
          >
            <option value="">{t('schedule.allTypes')}</option>
            {eventTypes.map((type: EventTypeItem) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
        {selectedEventTypeId && (
          <button
            type="button"
            className="flex items-center justify-center w-7 h-7 flex-shrink-0 border border-zinc-200 dark:border-zinc-600 rounded text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
            onClick={() => onEventTypeFilter('')}
            title={t('schedule.clearFilter')}
            aria-label={t('schedule.clearFilter')}
          >
            <IconClose className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <span className="flex-1 text-center text-sm font-semibold text-zinc-800 dark:text-zinc-200 whitespace-nowrap min-w-0 truncate">
        {monthLabel} {year}
      </span>

      <div className="flex items-center gap-0.5 flex-shrink-0">
        <div className="flex items-center gap-0.5 border border-zinc-200 dark:border-zinc-600 rounded-lg p-0.5 bg-white dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => onViewModeChange?.('month')}
            className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === 'month'
                ? 'bg-primary-100 dark:bg-primary-500/30 text-primary-700 dark:text-primary-200'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
            title={t('schedule.monthView') || 'Month view'}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange?.('week')}
            className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === 'week'
                ? 'bg-primary-100 dark:bg-primary-500/30 text-primary-700 dark:text-primary-200'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
            title={t('schedule.weekView') || 'Week view'}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <line x1="8" y1="4" x2="8" y2="22" />
              <line x1="16" y1="4" x2="16" y2="22" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          onClick={onToday}
          className="px-3 py-1.5 rounded text-sm font-medium border border-primary-300 dark:border-primary-600 bg-primary-500/15 dark:bg-primary-500/20 text-primary-700 dark:text-primary-200 hover:bg-primary-500/25 dark:hover:bg-primary-500/30 cursor-pointer transition-colors"
          title={t('schedule.goToToday')}
        >
          {t('schedule.today')}
        </button>
        <button
          type="button"
          onClick={onPrevMonth}
          className="w-7 h-7 flex items-center justify-center border border-zinc-200 dark:border-zinc-600 rounded text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer transition-colors flex-shrink-0"
          aria-label={viewMode === 'week' ? t('schedule.prevWeek') : t('schedule.prevMonth')}
          title={viewMode === 'week' ? t('schedule.prevWeek') : t('schedule.prevMonth')}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onNextMonth}
          className="w-7 h-7 flex items-center justify-center border border-zinc-200 dark:border-zinc-600 rounded text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer transition-colors flex-shrink-0"
          aria-label={viewMode === 'week' ? t('schedule.nextWeek') : t('schedule.nextMonth')}
          title={viewMode === 'week' ? t('schedule.nextWeek') : t('schedule.nextMonth')}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default CalendarHeader;
