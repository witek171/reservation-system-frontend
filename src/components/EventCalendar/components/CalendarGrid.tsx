import React, { useMemo } from 'react';
import { useI18n } from '../../../context/I18nContext.tsx';

interface CalendarEvent {
  id: string;
  startTime: string;
  status?: string;
  eventType?: { name?: string };
  placeName?: string;
}

interface CalendarGridProps {
  currentDate: Date;
  eventsByDate: Record<string, CalendarEvent[]>;
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent, e?: React.MouseEvent) => void;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  eventsByDate,
  onDayClick,
  onEventClick,
}) => {
  const { t, locale } = useI18n();
  const localeTag = locale === 'pl' ? 'pl-PL' : 'en-US';
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 0, 1 + i);
      return d.toLocaleDateString(localeTag, { weekday: 'short' });
    });
  }, [localeTag]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const days: { date: Date; dateKey: string; isCurrentMonth: boolean; isToday: boolean }[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        dateKey: formatDateKey(date),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        dateKey: formatDateKey(date),
        isCurrentMonth: true,
        isToday: isSameDay(date, today),
      });
    }

    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        dateKey: formatDateKey(date),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [currentDate]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(localeTag, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getStatusColor = (status?: string): string => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'primary';
      case 'pending':
        return 'amber';
      case 'cancelled':
        return 'red';
      default:
        return 'primary';
    }
  };

  const pillStatusClass: Record<string, string> = {
    primary:
      'bg-primary-100 dark:bg-primary-500/25 border-l-primary-500 dark:border-l-primary-400 dark:text-primary-100',
    amber:
      'bg-amber-100 dark:bg-amber-500/25 border-l-amber-500 dark:border-l-amber-400 dark:text-amber-100',
    red:
      'bg-red-100 dark:bg-red-500/25 border-l-red-500 dark:border-l-red-400 dark:text-red-100',
  };

  return (
    <div className="p-0">
      <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-700">
        {weekDays.map((day) => (
          <div
            key={day}
            className="bg-zinc-50 dark:bg-zinc-800 py-1 text-center text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-700">
        {calendarDays.map((dayData, index) => {
          const dayEvents = eventsByDate[dayData.dateKey] || [];

          return (
            <div
              key={index}
              className={`
                min-h-[100px] p-0.5 flex flex-col cursor-pointer transition-colors
                bg-white dark:bg-zinc-900
                hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50
                ${!dayData.isCurrentMonth ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''}
                ${dayData.isToday ? 'bg-primary-100 dark:bg-primary-500/10 ring-primary-400 dark:ring-primary-500/50' : ''}
              `}
              onClick={() => onDayClick(dayData.date)}
            >
              <span
                className={`
                  text-[11px] font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-0.5 shrink-0
                  ${dayData.isToday ? 'bg-primary-200 text-white dark:bg-primary-400 dark:text-zinc-900' : ''}
                  ${!dayData.isCurrentMonth ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-800 dark:text-zinc-200'}
                `}
              >
                {dayData.date.getDate()}
              </span>

              <div className="flex flex-col gap-px flex-1 min-h-0 overflow-hidden">
                {dayEvents.slice(0, 3).map((event) => {
                  const status = getStatusColor(event.status);
                  return (
                    <div
                      key={event.id}
                      className={`flex items-center gap-1.5 py-0.5 px-1 rounded-sm border-l-[3px] text-[11px] cursor-pointer transition-colors overflow-hidden text-ellipsis whitespace-nowrap ${pillStatusClass[status] ?? pillStatusClass.primary}`}
                      data-status={status}
                      onClick={(e) => onEventClick(event, e)}
                      title={`${event.eventType?.name || 'Event'} - ${event.placeName}`}
                    >
                      <span className="font-semibold text-zinc-800 dark:text-inherit shrink-0">
                        {formatTime(event.startTime)}
                      </span>
                      <span className="text-zinc-600 dark:text-inherit overflow-hidden text-ellipsis">
                        {event.eventType?.name || 'Event'}
                      </span>
                    </div>
                  );
                })}

                {dayEvents.length > 3 && (
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 py-0.5 px-1">
                    {t('schedule.more', { count: dayEvents.length - 3 })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
