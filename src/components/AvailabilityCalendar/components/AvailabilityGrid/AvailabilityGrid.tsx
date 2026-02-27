import React, { useMemo } from 'react';

interface SlotItem {
  id?: string;
  startTime: string;
  endTime: string;
  type?: string;
}

interface AvailabilityGridProps {
  currentDate: Date;
  availabilitiesByDate: Record<string, SlotItem[]>;
  classesByDate: Record<string, SlotItem[]>;
  onDayClick: (date: Date) => void;
  onEventClick: (item: SlotItem, e: React.MouseEvent) => void;
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

const AvailabilityGrid: React.FC<AvailabilityGridProps> = ({
  currentDate,
  availabilitiesByDate,
  classesByDate,
  onDayClick,
  onEventClick,
}) => {
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const isOverlapping = (startA: string, endA: string, startB: string, endB: string) => {
    return new Date(startA).getTime() < new Date(endB).getTime() && new Date(endA).getTime() > new Date(startB).getTime();
  };

  const pillStatusClass: Record<string, string> = {
    vacant: 'bg-green-100 dark:bg-green-900/30 border-l-green-500',
    unknown: 'bg-amber-100 dark:bg-amber-900/30 border-l-amber-500',
    occupied: 'bg-red-100 dark:bg-red-900/30 border-l-red-500',
  };

  return (
    <div className="p-0">
      <div className="grid grid-cols-7 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-1.5 text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarDays.map((dayData, index) => {
          const dayAvailabilities = availabilitiesByDate[dayData.dateKey] || [];
          const dayClasses = classesByDate[dayData.dateKey] || [];

          const mergedItems = [
            ...dayAvailabilities.map((a) => ({ ...a, type: 'availability' })),
            ...dayClasses.map((c) => ({ ...c, type: 'class' })),
          ].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

          return (
            <div
              key={index}
              className={`
                h-[120px] border-r border-b border-zinc-200 dark:border-zinc-700 [&:nth-child(7n)]:border-r-0 p-2 cursor-pointer transition-colors
                flex flex-col overflow-hidden
                bg-white dark:bg-zinc-900
                hover:bg-zinc-50 dark:hover:bg-zinc-800
                ${!dayData.isCurrentMonth ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''}
                ${dayData.isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
              `}
              onClick={() => onDayClick(dayData.date)}
            >
              <div className="flex justify-between items-start mb-1.5">
                <span
                  className={`
                    flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full
                    ${dayData.isToday
                      ? 'bg-blue-600 text-white'
                      : !dayData.isCurrentMonth
                        ? 'text-zinc-400 dark:text-zinc-500'
                        : 'text-zinc-800 dark:text-zinc-200'
                    }
                  `}
                >
                  {dayData.date.getDate()}
                </span>
              </div>

              <div className="flex flex-col gap-1 flex-1 min-h-0">
                {mergedItems.slice(0, 3).map((item, idx) => {
                  const isClass = item.type === 'class';
                  const occupied =
                    !isClass &&
                    dayClasses.some((cls) =>
                      isOverlapping(item.startTime, item.endTime, cls.startTime, cls.endTime)
                    );
                  const statusColor = occupied || isClass ? 'occupied' : 'vacant';

                  return (
                    <div
                      key={`${item.type}-${item.id ?? `${item.startTime}-${item.endTime}`}-${index}-${idx}`}
                      className={`flex items-center gap-1.5 py-1 px-2 rounded border-l-[3px] text-[11px] overflow-hidden border-l-blue-500 ${pillStatusClass[statusColor] || 'bg-blue-100 dark:bg-blue-900/30'}`}
                      data-status={statusColor}
                      onClick={!isClass ? (e) => onEventClick(item, e) : undefined}
                    >
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                        {formatTime(item.startTime)} - {formatTime(item.endTime)}
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400 whitespace-nowrap overflow-hidden text-ellipsis">
                        {occupied || isClass ? ' - Occupied ' : ' - Vacant '}
                      </span>
                    </div>
                  );
                })}

                {dayAvailabilities.length > 3 && (
                  <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium py-0.5 px-2 cursor-pointer">
                    +{dayAvailabilities.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AvailabilityGrid;
