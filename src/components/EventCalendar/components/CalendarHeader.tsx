import React from 'react';
import { useI18n } from '../../../context/I18nContext.tsx';
import Select from '../../common/Select.tsx';

interface EventTypeItem {
  id: string;
  name: string;
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
  onMonthLabelClick?: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
                                                         currentDate,
                                                         onPrevMonth,
                                                         onNextMonth,
                                                         onToday,
                                                         eventTypes,
                                                         selectedEventTypeId,
                                                         onEventTypeFilter,
                                                         loading,
                                                         viewMode = 'month',
                                                         onViewModeChange,
                                                         onMonthLabelClick,
                                                       }) => {
  const { t, locale } = useI18n();
  const localeTag = locale === 'pl' ? 'pl-PL' : 'en-US';

  const monthLabel = currentDate.toLocaleDateString(localeTag, { month: 'long', year: 'numeric' });

  const eventTypeOptions = [
    { value: '', label: t('schedule.allTypes') },
    ...eventTypes.map((type) => ({ value: type.id, label: type.name })),
  ];

  const navBtnClass = 'p-1.5 rounded-lg hover:bg-surface-container-low text-on-surface-variant transition-colors';

  return (
    <div className="p-3 md:p-4 border-b border-surface-variant bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onMonthLabelClick}
          className="font-h3 text-h3 text-on-surface capitalize whitespace-nowrap hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0"
        >
          {monthLabel}
        </button>

        <div className="flex items-center gap-0.5 ml-2">
          <button type="button" onClick={onPrevMonth} className={navBtnClass}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button type="button" onClick={onToday} className="px-3 py-1.5 rounded-lg hover:bg-surface-container-low font-label-bold text-label-bold text-on-surface transition-colors">
            {t('schedule.today')}
          </button>
          <button type="button" onClick={onNextMonth} className={navBtnClass}>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-44">
          <Select options={eventTypeOptions} value={selectedEventTypeId} onChange={(v) => onEventTypeFilter(String(v))} disabled={loading} />
        </div>

        <div className="flex bg-surface-container-low rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange?.('month')}
            className={`px-3 py-1.5 rounded-md font-label-bold text-label-bold text-sm transition-all ${viewMode === 'month' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            {t('schedule.monthView')}
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange?.('week')}
            className={`px-3 py-1.5 rounded-md font-label-bold text-label-bold text-sm transition-all ${viewMode === 'week' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            {t('schedule.weekView')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;