import React from 'react';
import { useI18n } from '../../../context/I18nContext.tsx';
import { useAuth } from '../../../context/AuthContext.tsx';
import { formatToPolishTime } from '../../../utils/formatDate.ts';
import { getEventTypeColor } from '../../../utils/colorUtils.ts';
import ModalPortal from '../../common/ModalPortal.tsx';

interface CalendarEvent {
  id: string;
  startTime: string;
  endTime?: string;
  status?: string;
  eventType?: { id?: string; name?: string };
  placeName?: string;
  participants?: { id: string }[];
}

interface DaySidebarProps {
  date: Date | null;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onAddEvent: (date: Date) => void;
  onClose: () => void;
  mobile?: boolean;
}

const closeBtnClass =
  'h-9 w-9 inline-flex items-center justify-center rounded-full text-outline hover:text-on-surface hover:bg-surface-variant transition-colors';

const getStatusInfo = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return { cls: 'bg-surface-container-low border border-outline-variant text-on-surface', icon: 'check_circle', iconCls: 'text-secondary' };
    case 'cancelled':
      return { cls: 'bg-error-container border border-error/20 text-on-error-container', icon: 'cancel', iconCls: 'text-error' };
    default:
      return { cls: 'bg-surface-container-low border border-outline-variant text-on-surface-variant', icon: 'schedule', iconCls: 'text-on-surface-variant' };
  }
};

const DaySidebar: React.FC<DaySidebarProps> = ({ date, events, onEventClick, onAddEvent, onClose, mobile = false }) => {
  const { t } = useI18n();
  const { isTrainer } = useAuth();

  const formatDateHeader = (d: Date | null) => {
    if (!d) return '—';
    return d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  // No date selected — placeholder
  if (!date && !mobile) {
    return (
      <div className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-[0_4px_24px_rgba(0,0,0,0.04)] h-full flex flex-col overflow-hidden sticky top-6">
        <div className="p-4 border-b border-surface-variant">
          <p className="font-body-md text-body-md font-semibold text-on-surface">{t('schedule.selectDay')}</p>
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{t('schedule.selectDayHint')}</p>
        </div>
      </div>
    );
  }

  if (!date) return null;

  const sidebarContent = (
    <>
      {/* Header */}
      <div className={`p-4 ${events.length > 0 ? 'border-b border-surface-variant' : ''}`}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-h3 text-h3 text-on-surface capitalize truncate flex-1 min-w-0">
            {formatDateHeader(date)}
          </h2>
          <button type="button" onClick={onClose} className={closeBtnClass}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <p className="font-body-sm text-body-sm text-on-surface-variant mb-3">
          {events.length > 0
            ? t('schedule.eventsOnThisDay', { count: events.length })
            : t('schedule.noEventsThisDay')}
        </p>

        {!isTrainer() && (
          <button
            type="button"
            onClick={() => onAddEvent(date)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-fixed-variant px-4 py-2.5 font-label-bold text-label-bold shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {t('schedule.addEvent')}
          </button>
        )}
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto p-3">
        {events.length > 0 ? (
          <div className="space-y-2">
            {events.map((event) => {
              const color = getEventTypeColor(event.eventType?.id || '');
              const startTime = formatToPolishTime(event.startTime);
              const endTime = event.endTime ? formatToPolishTime(event.endTime) : null;
              const status = getStatusInfo(event.status);
              const participantCount = event.participants?.length ?? 0;

              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onEventClick(event)}
                  className={`w-full text-left rounded-xl p-3 border transition-colors hover:bg-surface-container-low ${color.bg} ${color.borderClass}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-body-md text-body-md font-semibold text-on-surface truncate">
                        {event.eventType?.name || '—'}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {startTime.time}{endTime ? ` – ${endTime.time}` : ''}
                      </div>
                      {event.placeName && (
                        <div className="mt-0.5 flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {event.placeName}
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-3 flex-wrap">
                        {participantCount > 0 && (
                          <span className="inline-flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[14px]">group</span>
                            {participantCount}
                    </span>
                        )}
                        {event.status && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-label-bold ${status.cls}`}>
                      <span className={`material-symbols-outlined text-[12px] ${status.iconCls}`}>{status.icon}</span>
                            {event.status}
                    </span>
                        )}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-outline mt-1 shrink-0">chevron_right</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </>
  );

  if (mobile) {
    return (
      <ModalPortal blockScroll={false}>
        <div className="fixed inset-0 z-[9999] lg:hidden" onClick={onClose}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-surface-container-lowest rounded-t-2xl border-t border-surface-variant shadow-lg max-h-[75vh] flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-outline-variant rounded-full" />
            </div>
            {sidebarContent}
          </div>
        </div>
      </ModalPortal>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-[0_4px_24px_rgba(0,0,0,0.04)] h-full flex flex-col overflow-hidden sticky top-6">
      {sidebarContent}
    </div>
  );
};

export default DaySidebar;