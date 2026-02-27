import React, { useMemo } from 'react';
import { useI18n } from '../../../../context/I18nContext';

export interface SlotItem {
  id?: string;
  startTime: string;
  endTime: string;
  type?: string;
  eventType?: { name?: string };
  placeName?: string;
}

interface AvailabilityWeekGridProps {
  weekStart: Date; // Monday
  availabilitiesByDate: Record<string, SlotItem[]>;
  classesByDate: Record<string, SlotItem[]>;
  onSlotClick: (date: Date, hour: number) => void;
  onAvailabilityClick: (item: SlotItem, e: React.MouseEvent) => void;
}

const HOUR_START = 6;
const HOUR_END = 22;
const HOURS_TOTAL = HOUR_END - HOUR_START;
const ROW_HEIGHT_PX = 48;

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMinutesFromMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

/** Merge adjacent or overlapping availability slots (same day). Returns merged blocks; each has firstSlot for click. */
function mergeAvailabilitySlots(slots: SlotItem[]): { startTime: string; endTime: string; firstSlot: SlotItem }[] {
  if (slots.length === 0) return [];
  const sorted = [...slots].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const merged: { startTime: string; endTime: string; firstSlot: SlotItem }[] = [];
  let current = { start: new Date(sorted[0].startTime).getTime(), end: new Date(sorted[0].endTime).getTime(), firstSlot: sorted[0] };
  for (let i = 1; i < sorted.length; i++) {
    const start = new Date(sorted[i].startTime).getTime();
    const end = new Date(sorted[i].endTime).getTime();
    if (start <= current.end) {
      current.end = Math.max(current.end, end);
    } else {
      merged.push({
        startTime: new Date(current.start).toISOString(),
        endTime: new Date(current.end).toISOString(),
        firstSlot: current.firstSlot,
      });
      current = { start, end, firstSlot: sorted[i] };
    }
  }
  merged.push({
    startTime: new Date(current.start).toISOString(),
    endTime: new Date(current.end).toISOString(),
    firstSlot: current.firstSlot,
  });
  return merged;
}

const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };

const AvailabilityWeekGrid: React.FC<AvailabilityWeekGridProps> = ({
  weekStart,
  availabilitiesByDate,
  classesByDate,
  onSlotClick,
  onAvailabilityClick,
}) => {
  const { t, locale } = useI18n();
  const localeTag = locale === 'pl' ? 'pl-PL' : 'en-GB';

  const weekDays = useMemo(() => {
    const days: { date: Date; dateKey: string; label: string; isToday: boolean }[] = [];
    const d = new Date(weekStart);
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(d);
      date.setDate(d.getDate() + i);
      const label = date.toLocaleDateString(localeTag, { weekday: 'short' });
      days.push({
        date,
        dateKey: formatDateKey(date),
        label,
        isToday: isSameDay(date, today),
      });
    }
    return days;
  }, [weekStart, localeTag]);

  const timeLabels = useMemo(() => {
    const labels: string[] = [];
    for (let h = HOUR_START; h < HOUR_END; h++) {
      labels.push(`${String(h).padStart(2, '0')}:00`);
    }
    return labels;
  }, []);

  const gridHeight = HOURS_TOTAL * ROW_HEIGHT_PX;
  const dayStartMinutes = HOUR_START * 60;
  const daySpanMinutes = HOURS_TOTAL * 60;

  const getBlockStyle = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const startM = getMinutesFromMidnight(start) - dayStartMinutes;
    const endM = getMinutesFromMidnight(end) - dayStartMinutes;
    const topPct = Math.max(0, (startM / daySpanMinutes) * 100);
    const endPct = Math.min(100, (endM / daySpanMinutes) * 100);
    const heightPct = Math.max(2, endPct - topPct);
    return { top: `${topPct}%`, height: `${heightPct}%` };
  };

  return (
    <div className="flex flex-col min-w-0">
      <div className="grid gap-0 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
        <div className="py-2 pl-2 text-xs font-medium text-zinc-500 dark:text-zinc-400" />
        {weekDays.map((day) => (
          <div
            key={day.dateKey}
            className="py-2 text-center text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wide"
          >
            <span className={day.isToday ? 'text-primary-600 dark:text-primary-400' : ''}>{day.label}</span>
            <div className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400 mt-0.5">
              {day.date.getDate()} {day.date.toLocaleDateString(localeTag, { month: 'short' })}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        <div className="grid gap-0" style={{ gridTemplateColumns: '56px repeat(7, 1fr)', minWidth: '600px' }}>
          <div className="border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/30">
            {timeLabels.map((label, i) => (
              <div
                key={label}
                className="border-b border-zinc-100 dark:border-zinc-700/80 text-[11px] text-zinc-500 dark:text-zinc-400 pl-1 pr-1"
                style={{ height: ROW_HEIGHT_PX }}
              >
                {label}
              </div>
            ))}
          </div>

          {weekDays.map((day) => {
            const dayAvailabilities = availabilitiesByDate[day.dateKey] || [];
            const dayClasses = classesByDate[day.dateKey] || [];
            const mergedAvailabilities = mergeAvailabilitySlots(dayAvailabilities);
            type BlockItem =
              | { type: 'availability'; startTime: string; endTime: string; firstSlot: SlotItem }
              | { type: 'class'; startTime: string; endTime: string; eventType?: { name?: string }; placeName?: string; id?: string; firstSlot: null };
            const allBlocks: BlockItem[] = [
              ...mergedAvailabilities.map((m) => ({ type: 'availability' as const, startTime: m.startTime, endTime: m.endTime, firstSlot: m.firstSlot })),
              ...dayClasses.map((c) => ({ type: 'class' as const, startTime: c.startTime, endTime: c.endTime, eventType: c.eventType, placeName: c.placeName, id: c.id, firstSlot: null as null })),
            ].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

            return (
              <div
                key={day.dateKey}
                className="relative border-r border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                style={{ height: gridHeight }}
              >
                {timeLabels.map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors z-[0]"
                    style={{
                      position: 'absolute',
                      top: `${(i / HOURS_TOTAL) * 100}%`,
                      height: `${(1 / HOURS_TOTAL) * 100}%`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSlotClick(day.date, HOUR_START + i);
                    }}
                  />
                ))}

                {allBlocks.map((block) => {
                  const isClass = block.type === 'class';
                  const style = getBlockStyle(block.startTime, block.endTime);
                  const startStr = new Date(block.startTime).toLocaleTimeString(localeTag, timeOpts);
                  const endStr = new Date(block.endTime).toLocaleTimeString(localeTag, timeOpts);
                  const timeRange = `${startStr} – ${endStr}`;
                  const label = isClass ? (block.eventType?.name ?? block.placeName ?? '—') : t('availability.available');
                  const titleStr = isClass ? `${block.eventType?.name ?? 'Event'} ${block.placeName ?? ''} (${timeRange})` : timeRange;
                  return (
                    <div
                      key={isClass ? `class-${block.id}` : `avail-${block.firstSlot.id ?? block.startTime}`}
                      className={`absolute left-0.5 right-0.5 rounded-md overflow-hidden cursor-pointer transition-opacity hover:opacity-90 z-[1] ${
                        isClass
                          ? 'bg-primary-500/80 dark:bg-primary-600/80 text-white border border-primary-400/50'
                          : 'bg-emerald-500/80 dark:bg-emerald-600/80 text-white border border-emerald-400/50'
                      }`}
                      style={{ ...style, minHeight: '20px' }}
                      onClick={isClass ? undefined : (e) => onAvailabilityClick(block.firstSlot, e)}
                      title={titleStr}
                    >
                      <div className="px-1.5 py-0.5 text-[10px] font-medium truncate">
                        <span className="font-semibold">{timeRange}</span>
                        <span className="opacity-95"> · {label}</span>
                      </div>
                    </div>
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

export default AvailabilityWeekGrid;
