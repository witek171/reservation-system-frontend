import React, { useMemo } from 'react';
import { useI18n } from '../../../context/I18nContext.tsx';
import { formatToPolishTime } from '../../../utils/formatDate.ts';
import { getEventTypeColor } from '../../../utils/colorUtils.ts';

interface CalendarEvent {
  id: string;
  startTime: string;
  endTime?: string;
  eventType?: { id?: string; name?: string };
  placeName?: string;
}

interface TimeGridViewProps {
  currentDate: Date;
  eventsByDate: Record<string, CalendarEvent[]>;
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent, e?: React.MouseEvent) => void;
}

const HOUR_HEIGHT = 64;

function fdk(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const nd = new Date(monday);
    nd.setDate(monday.getDate() + i);
    return nd;
  });
}

// ── Konwersja czasu UTC do warszawskiego (ścieżka pochodna formatToPolishTime) ──
function parseBackendDate(value?: string | Date): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  let str = value.trim();
  if (!/[Zz]|[+-]\d{2}:?\d{2}$/.test(str)) {
    str += 'Z';
  }

  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
}

function toWarsawHM(dateStr: string): { hours: number; minutes: number } {
  const date = parseBackendDate(dateStr);
  if (!date) return { hours: 0, minutes: 0 };
  
  const parts = new Intl.DateTimeFormat('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Warsaw',
    hour12: false,
  }).formatToParts(date);
  
  const hour = parts.find(p => p.type === 'hour')?.value || '0';
  const minute = parts.find(p => p.type === 'minute')?.value || '0';
  
  return { hours: parseInt(hour, 10), minutes: parseInt(minute, 10) };
}

function layoutEvents(events: CalendarEvent[]): { event: CalendarEvent; column: number; totalColumns: number }[] {
  if (events.length === 0) return [];
  const getMin = (ev: CalendarEvent) => { const { hours, minutes } = toWarsawHM(ev.startTime); return hours * 60 + minutes; };
  const getEndMin = (ev: CalendarEvent) => { if (ev.endTime) { const { hours, minutes } = toWarsawHM(ev.endTime); return hours * 60 + minutes; } return getMin(ev) + 60; };
  const sorted = [...events].sort((a, b) => getMin(a) - getMin(b));
  const placed: { event: CalendarEvent; column: number; start: number; end: number }[] = [];
  for (const ev of sorted) {
    const start = getMin(ev), end = getEndMin(ev);
    const overlapping = placed.filter((p) => p.start < end && p.end > start);
    const used = new Set(overlapping.map((p) => p.column));
    let col = 0;
    while (used.has(col)) col++;
    placed.push({ event: ev, column: col, start, end });
  }
  return placed.map((p) => {
    const overlapping = placed.filter((o) => o.start < p.end && o.end > p.start);
    return { event: p.event, column: p.column, totalColumns: Math.max(...overlapping.map((o) => o.column)) + 1 };
  });
}

const TimeGridView: React.FC<TimeGridViewProps> = ({ currentDate, eventsByDate, onDayClick, onEventClick }) => {
  const { locale } = useI18n();
  const localeTag = locale === 'pl' ? 'pl-PL' : 'en-US';
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const { startHour, endHour } = useMemo(() => {
    let minH = 8, maxH = 18;
    Object.values(eventsByDate).forEach((events) => {
      events.forEach((ev) => {
        const s = toWarsawHM(ev.startTime);
        const sd = s.hours + s.minutes / 60;
        if (sd < minH) minH = sd;
        if (ev.endTime) {
          const e = toWarsawHM(ev.endTime);
          const ed = e.hours + e.minutes / 60;
          if (ed > maxH) maxH = ed;
        } else if (sd + 1 > maxH) maxH = sd + 1;
      });
    });
    return { startHour: Math.max(0, Math.floor(minH) - 1), endHour: Math.min(24, Math.ceil(maxH) + 1) };
  }, [eventsByDate]);

  const hourSlots = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const totalHeight = hourSlots.length * HOUR_HEIGHT;
  const today = new Date();

  const getEventPos = (event: CalendarEvent) => {
    const { hours, minutes } = toWarsawHM(event.startTime);
    const minutesFrom = (hours - startHour) * 60 + minutes;
    const top = (minutesFrom / 60) * HOUR_HEIGHT;
    let dur = 60;
    if (event.endTime) {
      const e = toWarsawHM(event.endTime);
      dur = (e.hours - hours) * 60 + (e.minutes - minutes);
    }
    return { top, height: Math.max((dur / 60) * HOUR_HEIGHT, HOUR_HEIGHT * 0.75) };
  };

  const getNowWarsawTop = () => {
    const now = toWarsawHM(new Date().toISOString());
    const minFrom = (now.hours - startHour) * 60 + now.minutes;
    return (minFrom / 60) * HOUR_HEIGHT;
  };

  return (
    <div className="flex flex-col overflow-hidden bg-surface-bright">
      {/* Day headers */}
      <div className="flex border-b border-surface-variant sticky top-0 bg-surface-bright z-10">
        <div className="w-14 md:w-16 border-r border-surface-variant shrink-0" />
        <div className="flex-1 grid grid-cols-7 divide-x divide-surface-variant">
          {weekDates.map((date) => {
            const isToday = date.toDateString() === today.toDateString();
            return (
              <div
                key={fdk(date)}
                onClick={() => onDayClick(date)}
                className={['py-2 md:py-3 text-center cursor-pointer hover:bg-surface-container-low transition-colors', isToday ? 'bg-primary/5 border-b-2 border-primary' : ''].join(' ')}
              >
                <div className={`font-label-bold text-label-bold uppercase text-[10px] md:text-[11px] ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {date.toLocaleDateString(localeTag, { weekday: 'short' })}
                </div>
                <div className={`text-lg md:font-h3 md:text-h3 mt-0.5 ${isToday ? 'text-primary' : 'text-on-surface'}`}>
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="flex flex-1 overflow-auto">
        {/* Hour labels — Warsaw time */}
        <div className="w-14 md:w-16 border-r border-surface-variant shrink-0 bg-surface-bright relative" style={{ height: totalHeight }}>
          {hourSlots.map((hour, i) => (
            <div key={hour} className="absolute right-0 pr-1.5 md:pr-2 flex items-start justify-end font-label-bold text-label-bold text-outline" style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}>
              <span className="text-[10px] md:text-[11px] mt-0.5">{String(hour).padStart(2, '0')}:00</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className="flex-1 grid grid-cols-7 divide-x divide-surface-variant relative" style={{ minHeight: totalHeight }}>
          {weekDates.map((date) => {
            const dayKey = fdk(date);
            const dayEvents = eventsByDate[dayKey] || [];
            const isToday = date.toDateString() === today.toDateString();
            const laid = layoutEvents(dayEvents);

            return (
              <div key={dayKey} className={`relative cursor-pointer ${isToday ? 'bg-primary/[0.03]' : ''}`} style={{ height: totalHeight }} onClick={() => onDayClick(date)}>
                {/* Hour lines */}
                {hourSlots.map((_, i) => (
                  <div key={`line-${i}`} className="absolute left-0 right-0 border-b border-surface-variant/50 pointer-events-none" style={{ top: i * HOUR_HEIGHT }} />
                ))}

                {/* Current time */}
                {isToday && (() => {
                  const top = getNowWarsawTop();
                  if (top < 0 || top > totalHeight) return null;
                  return (
                    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top }}>
                      <div className="h-0.5 bg-error w-full" />
                      <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-error" />
                    </div>
                  );
                })()}

                {/* Events */}
                {laid.map(({ event, column, totalColumns }) => {
                  const { top, height } = getEventPos(event);
                  const color = getEventTypeColor(event.eventType?.id || '');
                  const time = formatToPolishTime(event.startTime);
                  const endTime = event.endTime ? formatToPolishTime(event.endTime) : null;
                  const widthPercent = 100 / totalColumns;
                  const leftPercent = column * widthPercent;

                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onEventClick(event, e); }}
                      title={`${event.eventType?.name || ''} – ${event.placeName || ''}`}
                      className={`absolute rounded-lg border px-1.5 md:px-2 py-1 text-left overflow-hidden transition-shadow hover:shadow-md z-10 ${color.bg} ${color.text} ${color.borderClass}`}
                      style={{ top, height, left: `calc(${leftPercent}% + 2px)`, width: `calc(${widthPercent}% - 4px)` }}
                    >
                      <div className="font-label-bold text-label-bold text-[10px] md:text-[11px] truncate leading-tight">
                        {event.eventType?.name || '—'}
                      </div>
                      <div className="font-body-sm text-[10px] md:text-[11px] opacity-80 mt-px truncate leading-tight">
                        {time.time}{endTime ? ` – ${endTime.time}` : ''}
                      </div>
                      {event.placeName && height > HOUR_HEIGHT * 1.5 && (
                        <div className="font-body-sm text-[10px] font-medium mt-auto truncate leading-tight opacity-70">
                          {event.placeName}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TimeGridView;