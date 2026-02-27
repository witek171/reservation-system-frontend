import React, { useState, useMemo } from 'react';
import { useI18n } from '../../../../context/I18nContext';

interface EventSchedule {
  id: string;
  startTime: string;
  placeName?: string;
  eventType?: { id?: string; name?: string };
}

interface EventTypeItem {
  id: string;
  name: string;
}

interface EventCalendarSelectorProps {
  eventSchedules: EventSchedule[];
  eventTypes: EventTypeItem[];
  selectedEventId: string;
  onSelectEvent: (eventId: string) => void;
}

const EventCalendarSelector: React.FC<EventCalendarSelectorProps> = ({
  eventSchedules,
  eventTypes,
  selectedEventId,
  onSelectEvent,
}) => {
  const { t, locale } = useI18n();
  const localeTag = locale === 'pl' ? 'pl-PL' : 'en-US';
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState('');

  const toLocalDateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 0, 1 + i);
      return d.toLocaleDateString(localeTag, { weekday: 'short' });
    });
  }, [localeTag]);

  const eventsByDate = useMemo(() => {
    const grouped: Record<string, EventSchedule[]> = {};

    const filteredSchedules = eventTypeFilter
      ? eventSchedules.filter((s) => s.eventType?.id === eventTypeFilter)
      : eventSchedules;

    filteredSchedules.forEach((schedule) => {
      if (!schedule.startTime) return;
      const date = new Date(schedule.startTime);
      const dateKey = toLocalDateKey(date);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(schedule);
    });

    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    });

    return grouped;
  }, [eventSchedules, eventTypeFilter]);

  const eventsForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    const dateKey = toLocalDateKey(selectedDay);
    return eventsByDate[dateKey] || [];
  }, [selectedDay, eventsByDate]);

  const selectedEvent = useMemo(() => {
    return eventSchedules.find((s) => s.id === selectedEventId);
  }, [selectedEventId, eventSchedules]);

  const formatTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString(localeTag, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return { date: '-', time: '' };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(localeTag, { year: 'numeric', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const prevMonth = new Date(year, month, 0);
    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    const startingDayMondayFirst = (firstDay.getDay() + 6) % 7;
    for (let i = 0; i < startingDayMondayFirst; i++) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - startingDayMondayFirst + 1 + i),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateKey = toLocalDateKey(date);
    return eventsByDate[dateKey] || [];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelectedDay = (date: Date) => {
    return selectedDay && date.toDateString() === selectedDay.toDateString();
  };

  const hasSelectedEvent = (date: Date) => {
    if (!selectedEventId) return false;
    const dayEvents = getEventsForDate(date);
    return dayEvents.some((e) => e.id === selectedEventId);
  };

  const handleDayClick = (date: Date) => {
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length > 0) {
      setSelectedDay(date);
      if (selectedEventId) {
        const dateKey = toLocalDateKey(date);
        const selectedEventDate = selectedEvent?.startTime
          ? toLocalDateKey(new Date(selectedEvent.startTime))
          : null;
        if (selectedEventDate !== dateKey) {
          onSelectEvent('');
        }
      }
    }
  };

  const handleEventSelect = (eventId: string) => {
    onSelectEvent(eventId === selectedEventId ? '' : eventId);
  };

  const handleClosePanel = () => {
    setSelectedDay(null);
  };

  const calendarDays = getDaysInMonth(calendarDate);

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 gap-2">
        <select
          className="max-w-[220px] py-2 px-3 border border-zinc-200 dark:border-zinc-600 rounded text-base text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 cursor-pointer flex-shrink-0 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
          value={eventTypeFilter}
          onChange={(e) => setEventTypeFilter(e.target.value)}
          style={{ flex: 1, marginRight: 'var(--spacing-md)' }}
        >
          <option value="">{t('calendar.allEventTypes')}</option>
          {eventTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
        <span className="flex-1 text-center text-sm font-semibold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
          {calendarDate.toLocaleDateString(localeTag, { month: 'long', year: 'numeric' })}
        </span>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            type="button"
            className="w-7 h-7 flex items-center justify-center border border-zinc-200 dark:border-zinc-600 rounded text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer transition-colors flex-shrink-0"
            onClick={() => setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            className="w-7 h-7 flex items-center justify-center border border-zinc-200 dark:border-zinc-600 rounded text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer transition-colors flex-shrink-0"
            onClick={() => setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-700">
        {weekDays.map((day) => (
          <div
            key={day}
            className="bg-zinc-50 dark:bg-zinc-800 py-1 text-center text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase"
          >
            {day}
          </div>
        ))}

        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDate(day.date);
          const hasEvents = dayEvents.length > 0;

          return (
            <div
              key={index}
              className={`
                bg-white dark:bg-zinc-900 min-h-[60px] p-0.5 flex flex-col cursor-pointer transition-colors
                ${!day.isCurrentMonth ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''}
                ${isToday(day.date) ? 'bg-primary-100 dark:bg-primary-500/10 ring-primary-500 dark:ring-primary-500/50' : ''}
                ${isSelectedDay(day.date) ? 'bg-primary-50 dark:bg-primary-500/10 outline-2 outline outline-primary-400 dark:outline-primary-500 outline-offset-[-2px]' : ''}
                ${hasSelectedEvent(day.date) ? 'bg-primary-50 dark:bg-primary-500/10 outline-2 outline outline-primary-400 dark:outline-primary-500 outline-offset-[-2px]' : ''}
                ${hasEvents && !isToday(day.date) && !isSelectedDay(day.date) && !hasSelectedEvent(day.date) ? 'hover:bg-primary-50/50 dark:hover:bg-primary-500/10' : ''}
              `}
              onClick={() => handleDayClick(day.date)}
            >
              <span
                className={`
                  text-[11px] font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-0.5 shrink-0
                  ${isToday(day.date) ? 'bg-indigo-200 text-white shadow-sm dark:bg-primary-400 dark:text-zinc-900' : ''}
                  ${!day.isCurrentMonth ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-800 dark:text-zinc-200'}
                `}
              >
                {day.date.getDate()}
              </span>
              <div className="flex-1 flex flex-col gap-px overflow-hidden">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className={`text-[11px] py-0.5 px-1 rounded-sm whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer transition-colors ${
                      selectedEventId === event.id
                        ? 'bg-primary-500 text-white dark:bg-primary-400 dark:text-zinc-900'
                        : 'bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-500/30'
                    }`}
                    title={`${event.eventType?.name || 'Event'} - ${formatTime(event.startTime)}`}
                  >
                    {formatTime(event.startTime)} {event.eventType?.name || ''}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 py-0.5 px-1">
                    {t('calendar.more', { count: dayEvents.length - 2 })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDay && eventsForSelectedDay.length > 0 && (
        <div className="border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex justify-between items-center px-3 py-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-700">
            <span>
              {t('calendar.selectEventOn')}{' '}
              {selectedDay.toLocaleDateString(localeTag, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <button
              type="button"
              className="w-7 h-7 flex items-center justify-center border border-zinc-200 dark:border-zinc-600 rounded text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
              onClick={handleClosePanel}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {eventsForSelectedDay.map((event) => (
              <div
                key={event.id}
                className={`flex items-start gap-2 py-2 px-3 cursor-pointer transition-colors border-b border-zinc-100 dark:border-zinc-700 last:border-b-0 ${
                selectedEventId === event.id ? 'bg-primary-50 dark:bg-primary-500/20' : 'hover:bg-white dark:hover:bg-zinc-900'
              }`}
              onClick={() => handleEventSelect(event.id)}
            >
              <div
                className={`w-[18px] h-[18px] rounded-full border-2 border-zinc-200 dark:border-zinc-600 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                  selectedEventId === event.id ? 'bg-primary-500 border-primary-500 dark:bg-primary-400 dark:border-primary-400' : ''
                }`}
              >
                  {selectedEventId === event.id && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-2.5 h-2.5 text-white">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {event.eventType?.name || 'Event'}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{formatTime(event.startTime)}</span>
                    <span>•</span>
                    <span>{event.placeName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="flex items-center gap-4 p-4 bg-primary-50/80 dark:bg-primary-500/10 border-t border-primary-200/50 dark:border-primary-500/20">
          <div className="w-8 h-8 bg-primary-500 dark:bg-primary-400 text-white dark:text-zinc-900 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-primary-600 dark:text-primary-400 uppercase font-medium">
              {t('calendar.selectedEvent')}
            </div>
            <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap overflow-hidden text-ellipsis">
              {selectedEvent.eventType?.name || 'Event'}
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              {selectedEvent.placeName} • {formatDateTime(selectedEvent.startTime).date} at{' '}
              {formatTime(selectedEvent.startTime)}
            </div>
          </div>
          <button
            type="button"
            className="py-1.5 px-3 border border-primary-300 dark:border-primary-600 rounded-xl text-primary-600 dark:text-primary-300 text-sm cursor-pointer transition-colors hover:bg-primary-100 dark:hover:bg-primary-500/20 flex-shrink-0"
            onClick={() => onSelectEvent('')}
          >
            {t('calendar.clear')}
          </button>
        </div>
      )}
    </div>
  );
};

export default EventCalendarSelector;
