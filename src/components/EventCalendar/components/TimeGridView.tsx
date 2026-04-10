import React, { useMemo } from 'react';
import { useI18n } from '../../../context/I18nContext.tsx';
import { getEventTypeColor } from '../../../utils/colorUtils.ts';

interface CalendarEvent {
  id: string;
  startTime: string;
  endTime?: string;
  status?: string;
  eventType?: { id?: string; name?: string };
  placeName?: string;
}

interface WeekGridProps {
  currentDate: Date;
  eventsByDate: Record<string, CalendarEvent[]>;
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent, e?: React.MouseEvent) => void;
}

const CELL_HEIGHT = 60;
const GRID_INTERVAL = 15;

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
}

const TimeGridView: React.FC<WeekGridProps> = ({
                                                 currentDate,
                                                 eventsByDate,
                                                 onDayClick,
                                                 onEventClick,
                                               }) => {
  const { locale } = useI18n();
  const localeTag = locale === 'pl' ? 'pl-PL' : 'en-US';

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const { startHour, endHour } = useMemo(() => {
    let minHour = 9;
    let maxHour = 18;

    Object.values(eventsByDate).forEach((events) => {
      events.forEach((event) => {
        const start = new Date(event.startTime);
        const startH = start.getHours();
        const startM = start.getMinutes();
        const startDecimal = startH + startM / 60;

        if (startDecimal < minHour) minHour = startDecimal;

        if (event.endTime) {
          const end = new Date(event.endTime);
          const endH = end.getHours();
          const endM = end.getMinutes();
          const endDecimal = endH + endM / 60;
          if (endDecimal > maxHour) maxHour = endDecimal;
        } else {
          const estimatedEnd = startDecimal + 1;
          if (estimatedEnd > maxHour) maxHour = estimatedEnd;
        }
      });
    });

    const roundedStartHour = minHour > 0.25 ? minHour - 0.25 : 0;
    const roundedEndHour = Math.min(24, maxHour + 0.25);

    const snappedStart = Math.floor(roundedStartHour * 4) / 4;
    const snappedEnd = Math.ceil(roundedEndHour * 4) / 4;

    return { startHour: snappedStart, endHour: snappedEnd };
  }, [eventsByDate]);

  const HOURS = Array.from(
    { length: Math.round((endHour - startHour) * 4) },
    (_, i) => startHour + (i * GRID_INTERVAL) / 60
  );

  const weekDayNames = useMemo(() => {
    return weekDates.map((date) => ({
      date,
      dayName: date.toLocaleDateString(localeTag, { weekday: 'short' }),
      dayNum: date.getDate(),
    }));
  }, [weekDates, localeTag]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(localeTag, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getEventPositionAndHeight = (
    event: CalendarEvent,
    startHourOffset: number
  ) => {
    const startDate = new Date(event.startTime);
    const startH = startDate.getHours();
    const startM = startDate.getMinutes();

    const minutesFromGridStart = (startH - startHourOffset) * 60 + startM;
    const topOffset = (minutesFromGridStart / GRID_INTERVAL) * CELL_HEIGHT;

    let durationMinutes = 60;
    if (event.endTime) {
      const endDate = new Date(event.endTime);
      const endH = endDate.getHours();
      const endM = endDate.getMinutes();
      durationMinutes = (endH - startH) * 60 + (endM - startM);
    }

    const heightEstimate = (durationMinutes / GRID_INTERVAL) * CELL_HEIGHT;

    return { topOffset, height: Math.max(heightEstimate, CELL_HEIGHT * 2) };
  };

  const getEventsForDay = (dateKey: string): CalendarEvent[] => {
    return eventsByDate[dateKey] || [];
  };

  const getDayKey = (date: Date) => formatDateKey(date);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex gap-px bg-zinc-200 dark:bg-zinc-700 overflow-x-auto">
        <div className="w-16 flex-shrink-0 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700" />
        {weekDayNames.map(({ date, dayName, dayNum }) => {
          const isToday = date.toDateString() === new Date().toDateString();
          return (
            <div
              key={getDayKey(date)}
              className={`
                flex-1 min-w-[120px] p-2 text-center border-b border-zinc-200 dark:border-zinc-700
                ${
                isToday
                  ? 'bg-primary-50 dark:bg-primary-500/10'
                  : 'bg-zinc-50 dark:bg-zinc-800'
              }
              `}
            >
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                {dayName}
              </div>
              <div
                className={`
                  text-lg font-bold mt-1
                  ${
                  isToday
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-zinc-800 dark:text-zinc-200'
                }
                `}
              >
                {dayNum}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-1 overflow-auto">
        <div
          className="w-16 flex-shrink-0 bg-zinc-50 dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700"
          style={{ minHeight: `${HOURS.length * CELL_HEIGHT}px` }}
        >
          {HOURS.map((hour) => {
            const minutes = Math.round((hour - Math.floor(hour)) * 60);
            const isFullHour = minutes === 0;
            const hasBoldBottomBorder = minutes === 45;

            return (
              <div
                key={hour}
                className={`
                  text-xs text-right pr-2 border-b
                  ${
                  hasBoldBottomBorder
                    ? 'border-zinc-300 dark:border-zinc-500'
                    : 'border-zinc-100 dark:border-zinc-700'
                }
                  ${
                  isFullHour
                    ? 'font-medium text-zinc-500 dark:text-zinc-400'
                    : 'font-normal text-zinc-400 dark:text-zinc-600'
                }
                `}
                style={{ height: `${CELL_HEIGHT}px`, lineHeight: '1' }}
              >
                <div className={`pt-0.5 ${isFullHour ? 'block' : 'hidden'}`}>
                  {String(Math.floor(hour)).padStart(2, '0')}:00
                </div>
              </div>
            );
          })}
        </div>

        {weekDayNames.map(({ date }) => {
          const dayKey = getDayKey(date);
          const dayEvents = getEventsForDay(dayKey);
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div
              key={dayKey}
              className={`
                flex-1 min-w-[120px] relative border-r border-zinc-200 dark:border-zinc-700
                ${
                isToday
                  ? 'bg-primary-50/30 dark:bg-primary-500/5'
                  : 'bg-white dark:bg-zinc-900'
              }
              `}
              style={{ minHeight: `${HOURS.length * CELL_HEIGHT}px` }}
              onClick={() => onDayClick(date)}
            >
              {HOURS.map((hour, idx) => {
                const minutes = Math.round((hour - Math.floor(hour)) * 60);
                const hasBoldBottomBorder = minutes === 45;

                return (
                  <div
                    key={`grid-${hour}`}
                    className={`
                      absolute w-full border-b
                      ${
                      hasBoldBottomBorder
                        ? 'border-zinc-300 dark:border-zinc-500'
                        : 'border-zinc-100 dark:border-zinc-700/50'
                    }
                    `}
                    style={{
                      height: `${CELL_HEIGHT}px`,
                      top: `${idx * CELL_HEIGHT}px`,
                      pointerEvents: 'none',
                    }}
                  />
                );
              })}

              {dayEvents.map((event) => {
                const { topOffset, height } = getEventPositionAndHeight(
                  event,
                  startHour
                );
                const color = getEventTypeColor(event.eventType?.id || '');

                return (
                  <div
                    key={event.id}
                    className={`
                      absolute left-0.5 right-0.5 ${color.bg} ${color.light} ${color.text}
                      border-l-4 rounded-sm p-1.5 cursor-pointer transition-all
                      hover:shadow-lg hover:z-20 overflow-hidden flex flex-col text-clip
                    `}
                    style={{
                      top: `${topOffset}px`,
                      height: `${height}px`,
                      borderLeftColor: color.border,
                      zIndex: 5,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event, e);
                    }}
                    title={`${event.eventType?.name || 'Event'} - ${event.placeName}`}
                  >
                    <div className="text-[11px] font-bold whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
                      {formatTime(event.startTime)}
                      {event.endTime && ` - ${formatTime(event.endTime)}`}
                    </div>
                    <div className="text-[10px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
                      {event.eventType?.name || 'Event'}
                    </div>
                    {event.placeName && height > CELL_HEIGHT * 3 && (
                      <div className="text-[9px] whitespace-nowrap overflow-hidden text-ellipsis opacity-85 leading-tight">
                        {event.placeName}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimeGridView;