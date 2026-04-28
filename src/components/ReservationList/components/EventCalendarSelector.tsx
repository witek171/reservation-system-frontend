import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../../context/I18nContext.tsx';
import Select from '../../common/Select.tsx';

interface EventSchedule {
  id: string;
  startTime: string;
  placeName?: string;
  eventType?: {
    id?: string;
    name?: string;
    price?: number;
  };
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

const navBtnClass =
  'h-9 w-9 inline-flex items-center justify-center rounded-full text-outline hover:text-on-surface hover:bg-surface-variant transition-colors';

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
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('');

  const toLocalDateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 0, 1 + i);
      return d.toLocaleDateString(localeTag, { weekday: 'short' });
    });
  }, [localeTag]);

  const eventTypeOptions = useMemo(
    () => [
      { value: '', label: t('calendar.allEventTypes') },
      ...eventTypes.map((type) => ({ value: type.id, label: type.name })),
    ],
    [eventTypes, t]
  );

  const filteredSchedules = useMemo(() => {
    if (!eventTypeFilter) return eventSchedules;
    return eventSchedules.filter((s) => s.eventType?.id === eventTypeFilter);
  }, [eventSchedules, eventTypeFilter]);

  const eventsByDate = useMemo(() => {
    const grouped: Record<string, EventSchedule[]> = {};

    filteredSchedules.forEach((schedule) => {
      if (!schedule.startTime) return;
      const date = new Date(schedule.startTime);
      const dateKey = toLocalDateKey(date);

      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(schedule);
    });

    Object.keys(grouped).forEach((key) => {
      grouped[key].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    });

    return grouped;
  }, [filteredSchedules]);

  const selectedEvent = useMemo(() => {
    return eventSchedules.find((s) => s.id === selectedEventId);
  }, [eventSchedules, selectedEventId]);

  useEffect(() => {
    if (!selectedDay) return;
    const key = toLocalDateKey(selectedDay);
    if (!eventsByDate[key]?.length) {
      setSelectedDay(null);
    }
  }, [selectedDay, eventsByDate]);

  useEffect(() => {
    if (!eventTypeFilter || !selectedEventId) return;
    const current = eventSchedules.find((s) => s.id === selectedEventId);
    if (current?.eventType?.id !== eventTypeFilter) {
      onSelectEvent('');
    }
  }, [eventTypeFilter, selectedEventId, eventSchedules, onSelectEvent]);

  const eventsForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return eventsByDate[toLocalDateKey(selectedDay)] || [];
  }, [selectedDay, eventsByDate]);

  const formatTime = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleTimeString(localeTag, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return { date: '—', time: '' };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(localeTag, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString(localeTag, {
        hour: '2-digit',
        minute: '2-digit',
      }),
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
    return eventsByDate[toLocalDateKey(date)] || [];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelectedDay = (date: Date) => {
    return !!selectedDay && date.toDateString() === selectedDay.toDateString();
  };

  const hasSelectedEvent = (date: Date) => {
    if (!selectedEventId) return false;
    return getEventsForDate(date).some((e) => e.id === selectedEventId);
  };

  const handleDayClick = (date: Date) => {
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length === 0) return;

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
  };

  const handleEventSelect = (eventId: string) => {
    onSelectEvent(eventId === selectedEventId ? '' : eventId);
  };

  const calendarDays = getDaysInMonth(calendarDate);

  return (
    <div className="rounded-xl border border-surface-variant bg-surface overflow-hidden">
      <div className="p-4 border-b border-surface-variant bg-surface-bright flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:w-72">
          <Select
            options={eventTypeOptions}
            value={eventTypeFilter}
            onChange={(value) => setEventTypeFilter(String(value))}
          />
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-3">
          <button
            type="button"
            className={navBtnClass}
            onClick={() =>
              setCalendarDate(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
              )
            }
            aria-label="Poprzedni miesiąc"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>

          <span className="min-w-[180px] text-center font-body-md text-body-md font-semibold text-on-surface capitalize">
            {calendarDate.toLocaleDateString(localeTag, { month: 'long', year: 'numeric' })}
          </span>

          <button
            type="button"
            className={navBtnClass}
            onClick={() =>
              setCalendarDate(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
              )
            }
            aria-label="Następny miesiąc"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-surface-variant">
        {weekDays.map((day) => (
          <div
            key={day}
            className="bg-surface-container-low py-2 text-center text-[11px] font-label-bold uppercase tracking-wider text-on-surface-variant"
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
              className={[
                'min-h-[84px] p-1.5 flex flex-col bg-surface transition-colors',
                day.isCurrentMonth ? '' : 'bg-surface-container-low/60',
                hasEvents ? 'cursor-pointer' : 'cursor-default',
                isToday(day.date) ? 'ring-1 ring-inset ring-primary/30' : '',
                isSelectedDay(day.date) || hasSelectedEvent(day.date)
                  ? 'bg-primary/5 ring-2 ring-inset ring-primary'
                  : '',
                hasEvents &&
                !isSelectedDay(day.date) &&
                !hasSelectedEvent(day.date) &&
                !isToday(day.date)
                  ? 'hover:bg-surface-container-low'
                  : '',
              ].join(' ')}
              onClick={() => handleDayClick(day.date)}
            >
              <span
                className={[
                  'mb-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                  isToday(day.date)
                    ? 'bg-primary text-on-primary'
                    : day.isCurrentMonth
                      ? 'text-on-surface'
                      : 'text-outline',
                ].join(' ')}
              >
                {day.date.getDate()}
              </span>

              <div className="flex flex-col gap-1 overflow-hidden">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className={[
                      'rounded px-1.5 py-1 text-[10px] leading-tight truncate',
                      selectedEventId === event.id
                        ? 'bg-primary text-on-primary'
                        : 'bg-tertiary-fixed text-on-tertiary-fixed',
                    ].join(' ')}
                    title={`${event.eventType?.name || 'Event'} - ${formatTime(event.startTime)}`}
                  >
                    {formatTime(event.startTime)} {event.eventType?.name || ''}
                  </div>
                ))}

                {dayEvents.length > 2 && (
                  <span className="px-1 text-[10px] text-on-surface-variant">
                    {t('calendar.more', { count: dayEvents.length - 2 })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDay && eventsForSelectedDay.length > 0 && (
        <div className="border-t border-surface-variant bg-surface-bright">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-surface-variant">
            <span className="font-body-md text-body-md font-semibold text-on-surface">
              {t('calendar.selectEventOn')}{' '}
              {selectedDay.toLocaleDateString(localeTag, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </span>

            <button
              type="button"
              className={navBtnClass}
              onClick={() => setSelectedDay(null)}
              aria-label="Zamknij"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="max-h-[260px] overflow-y-auto divide-y divide-surface-variant">
            {eventsForSelectedDay.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => handleEventSelect(event.id)}
                className={[
                  'w-full px-4 py-3 text-left transition-colors flex items-start gap-3',
                  selectedEventId === event.id
                    ? 'bg-primary/5'
                    : 'hover:bg-surface-container-low',
                ].join(' ')}
              >
                <div
                  className={[
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                    selectedEventId === event.id
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-outline-variant bg-surface',
                  ].join(' ')}
                >
                  {selectedEventId === event.id && (
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-body-md text-body-md font-semibold text-on-surface">
                    {event.eventType?.name || 'Event'}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-body-sm text-body-sm text-on-surface-variant">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      {formatTime(event.startTime)}
                    </span>

                    {event.placeName && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                        {event.placeName}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="border-t border-primary/20 bg-primary/5 px-4 py-4 flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">check</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-label-bold text-label-bold uppercase tracking-wider text-primary">
              {t('calendar.selectedEvent')}
            </div>

            <div className="mt-1 font-body-md text-body-md font-semibold text-on-surface truncate">
              {selectedEvent.eventType?.name || 'Event'}
            </div>

            <div className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              {selectedEvent.placeName || '—'} • {formatDateTime(selectedEvent.startTime).date},{' '}
              {formatDateTime(selectedEvent.startTime).time}
            </div>

            {selectedEvent.eventType?.price != null && (
              <div className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                {Number(selectedEvent.eventType.price).toFixed(2)} PLN / os.
              </div>
            )}
          </div>

          <button
            type="button"
            className="px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface font-label-bold text-label-bold hover:bg-surface-container-low transition-colors"
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