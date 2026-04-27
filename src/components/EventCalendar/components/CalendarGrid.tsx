import React, {useMemo} from 'react';
import {useI18n} from '../../../context/I18nContext.tsx';
import {formatToPolishTime} from '../../../utils/formatDate.ts';
import {getEventTypeColor} from '../../../utils/colorUtils.ts';

interface CalendarEvent {
  id: string;
  startTime: string;
  endTime?: string;
  eventType?: { id?: string; name?: string };
  placeName?: string;
}

interface CalendarGridProps {
  currentDate: Date;
  eventsByDate: Record<string, CalendarEvent[]>;
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent, e?: React.MouseEvent) => void;
}

function fdk(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({currentDate, eventsByDate, onDayClick, onEventClick}) => {
  const {locale} = useI18n();
  const localeTag = locale === 'pl' ? 'pl-PL' : 'en-US';

  const weekDays = useMemo(() =>
      Array.from({length: 7}, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(localeTag, {weekday: 'short'})),
    [localeTag]
  );

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days: { date: Date; dateKey: string; isCurrentMonth: boolean; isToday: boolean }[] = [];

    const prevLast = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevLast - i);
      days.push({date, dateKey: fdk(date), isCurrentMonth: false, isToday: false});
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        dateKey: fdk(date),
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString()
      });
    }
    const remaining = 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      const date = new Date(year, month + 1, day);
      days.push({date, dateKey: fdk(date), isCurrentMonth: false, isToday: false});
    }
    return days;
  }, [currentDate]);

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-surface-variant">
        {weekDays.map((day) => (
          <div key={day}
               className="py-2 text-center font-label-bold text-label-bold text-on-surface-variant uppercase text-[11px]">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarDays.map((dayData, index) => {
          const dayEvents = eventsByDate[dayData.dateKey] || [];

          return (
            <div
              key={index}
              onClick={() => onDayClick(dayData.date)}
              className={[
                'min-h-[80px] md:min-h-[100px] p-1 md:p-1.5 flex flex-col cursor-pointer transition-colors border-b border-r border-surface-variant',
                dayData.isToday ? 'bg-primary/5' : dayData.isCurrentMonth ? 'bg-surface-bright hover:bg-surface-container-low' : 'bg-surface-container-low/60 hover:bg-surface-container',
              ].join(' ')}
            >
              <span className={[
                'mb-0.5 inline-flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full text-[11px] font-semibold self-start',
                dayData.isToday ? 'bg-primary text-on-primary' : dayData.isCurrentMonth ? 'text-on-surface' : 'text-outline',
              ].join(' ')}>
                {dayData.date.getDate()}
              </span>

              <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                {dayEvents.slice(0, 3).map((event) => {
                  const color = getEventTypeColor(event.eventType?.id || '');
                  const time = formatToPolishTime(event.startTime);
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event, e);
                      }}
                      title={`${event.eventType?.name || ''} – ${event.placeName || ''}`}
                      className={`w-full text-left flex items-center gap-1 rounded border px-1 py-px text-[10px] md:text-[11px] font-medium truncate hover:opacity-80 transition-opacity ${color.bg} ${color.text} ${color.borderClass}`}
                    >
                      <span className="font-bold shrink-0">{time.time}</span>
                      <span className="truncate hidden sm:inline">{event.eventType?.name || ''}</span>
                    </button>
                  );
                })}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] text-on-surface-variant px-1">+{dayEvents.length - 3}</span>
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