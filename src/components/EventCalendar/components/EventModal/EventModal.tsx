import React, { useState, useEffect } from 'react';
import { useI18n } from '../../../../context/I18nContext';
import { staffMemberApi } from '../../../../services/api';
import { extractErrorMessage } from '../../../../utils/errorUtils';
import { IconClose } from '../../../common/Icons/Icons';

interface EventTypeItem {
  id: string;
  name: string;
  duration?: number;
  price?: number;
}

interface CalendarEvent {
  id: string;
  startTime: string;
  status?: string;
  eventType?: { id?: string; name?: string };
  placeName?: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  selectedDate: Date | null;
  selectedEvent: CalendarEvent | null;
  eventTypes: EventTypeItem[];
  eventsForDay: CalendarEvent[];
  onSave?: (formData: { eventTypeId: string; placeName: string; startTime: Date }) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
  onEditEvent?: (event: CalendarEvent) => void;
  readOnly?: boolean;
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  companyId,
  selectedDate,
  selectedEvent,
  eventTypes,
  eventsForDay,
  onSave,
  onDelete,
  onEditEvent,
  readOnly = false,
}) => {
  const { t, locale } = useI18n();
  const localeTag = locale === 'pl' ? 'pl-PL' : 'en-US';
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [assignStaffEvent, setAssignStaffEvent] = useState<CalendarEvent | null>(null);
  const [staffList, setStaffList] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [assignStaffId, setAssignStaffId] = useState('');
  const [assignStaffDropdownOpen, setAssignStaffDropdownOpen] = useState(false);
  const [assigningStaff, setAssigningStaff] = useState(false);
  const [assignStaffError, setAssignStaffError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    eventTypeId: '',
    placeName: '',
    time: '09:00',
  });

  useEffect(() => {
    if (selectedEvent) {
      const eventDate = new Date(selectedEvent.startTime);
      const hours = String(eventDate.getHours()).padStart(2, '0');
      const minutes = String(eventDate.getMinutes()).padStart(2, '0');

      setFormData({
        eventTypeId: selectedEvent.eventType?.id || '',
        placeName: selectedEvent.placeName || '',
        time: `${hours}:${minutes}`,
      });
    } else {
      setFormData({
        eventTypeId: '',
        placeName: '',
        time: '09:00',
      });
    }
    setFormError(null);
  }, [selectedEvent, selectedDate]);

  useEffect(() => {
    if (!companyId || !assignStaffEvent) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await staffMemberApi.getAll(companyId, { page: 0, pageSize: 500 });
        const data = res.data as { items?: { id: string; firstName: string; lastName: string }[] };
        if (!cancelled) setStaffList(data.items || []);
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, [companyId, assignStaffEvent?.id]);

  const handleAssignStaff = async () => {
    if (!companyId || !assignStaffEvent || !assignStaffId) return;
    setAssignStaffError(null);
    try {
      setAssigningStaff(true);
      await staffMemberApi.assignToEventSchedule(companyId, {
        eventScheduleId: assignStaffEvent.id,
        staffMemberId: assignStaffId,
      });
      setAssignStaffId('');
      setAssignStaffDropdownOpen(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: unknown } };
      setAssignStaffError(extractErrorMessage(e.response?.data ?? err));
    } finally {
      setAssigningStaff(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedDate) {
      setFormError(t('schedule.noDate'));
      return;
    }

    setSaving(true);

    try {
      const [hours, minutes] = formData.time.split(':').map(Number);

      const eventDateTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        hours,
        minutes,
        0,
        0
      );

      if (isNaN(eventDateTime.getTime())) {
        setFormError(t('schedule.invalidDate'));
        return;
      }

      await onSave?.({
        eventTypeId: formData.eventTypeId,
        placeName: formData.placeName,
        startTime: eventDateTime,
      });
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatDate = (date: Date | null) => {
    if (!date) return t('schedule.noDate');
    return new Date(date).toLocaleDateString(localeTag, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(localeTag, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getStatusLabel = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return t('reservations.confirmed');
      case 'pending':
        return t('reservations.pending');
      case 'cancelled':
        return t('reservations.cancelled');
      default:
        return status || t('reservations.pending');
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200';
      case 'pending':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      default:
        return 'bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200';
    }
  };

  if (!isOpen) return null;

  const selectedStaffDisplay = assignStaffId ? staffList.find((s) => s.id === assignStaffId) : null;
  const isEditing = !!selectedEvent;
  const otherEventsForDay = eventsForDay.filter(
    (event) => !selectedEvent || event.id !== selectedEvent.id
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/60 flex items-center justify-center z-[100] p-6"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-soft dark:shadow-soft-dark w-full max-w-[480px] overflow-hidden border border-zinc-200 dark:border-zinc-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start px-6 py-5 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/50">
          <div className="flex items-start gap-3.5">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex-shrink-0">
              {isEditing ? (
                <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              ) : (
                <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <line x1="12" y1="14" x2="12" y2="18" />
                  <line x1="10" y1="16" x2="14" y2="16" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 m-0 mb-0.5">
                {readOnly ? formatDate(selectedDate) : isEditing ? t('schedule.editEvent') : t('schedule.newEvent')}
              </h2>
              {readOnly && (
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 m-0">
                  {eventsForDay.length > 0 ? t('schedule.eventsOnThisDay', { count: eventsForDay.length }) : t('schedule.noEventsThisDay')}
                </p>
              )}
              {!readOnly && (
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 m-0">
                  {formatDate(selectedDate)}
                </p>
              )}
            </div>
          </div>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-transparent text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 cursor-pointer transition-colors"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-100px)]">
          {!readOnly && formError && (
            <div className="flex items-center gap-2 py-3 px-4 mb-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-[13px]">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{formError}</span>
            </div>
          )}

          {!readOnly && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="eventTypeId" className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                {t('schedule.eventType')}
              </label>
              <div className="relative">
                <select
                  id="eventTypeId"
                  name="eventTypeId"
                  value={formData.eventTypeId}
                  onChange={handleInputChange}
                  required
                  className="w-full py-2.5 px-3.5 pr-10 border border-zinc-200 dark:border-zinc-600 rounded-xl text-sm bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 cursor-pointer transition-colors hover:border-zinc-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">{t('schedule.selectEventType')}</option>
                  {eventTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.duration ?? 0} min, {type.price ?? 0})
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 pointer-events-none"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="placeName" className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                {t('schedule.location')}
              </label>
              <input
                type="text"
                id="placeName"
                name="placeName"
                value={formData.placeName}
                onChange={handleInputChange}
                placeholder={t('schedule.locationPlaceholder')}
                required
                className="py-2.5 px-3.5 border border-zinc-200 dark:border-zinc-600 rounded-xl text-sm bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="time" className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                {t('schedule.startTime')}
              </label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
                className="py-2.5 px-3.5 border border-zinc-200 dark:border-zinc-600 rounded-xl text-sm bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div className="flex justify-between items-center gap-3 pt-3 mt-2 border-t border-zinc-200 dark:border-zinc-700">
              {isEditing && onDelete && (
                <button
                  type="button"
                  onClick={() => selectedEvent && onDelete(selectedEvent.id)}
                  className="inline-flex items-center gap-1.5 py-2 px-3.5 border border-red-200 dark:border-red-800 rounded-xl bg-white dark:bg-zinc-900 text-red-600 dark:text-red-400 text-[13px] font-medium cursor-pointer transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  {t('schedule.delete')}
                </button>
              )}

              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-4 border border-zinc-200 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-[13px] font-medium cursor-pointer transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {t('schedule.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving || !selectedDate}
                  className="inline-flex items-center gap-2 rounded-xl border border-primary-300 bg-primary-500/15 px-4 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-500/25 dark:border-primary-600 dark:bg-primary-500/20 dark:text-primary-200 dark:hover:bg-primary-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 dark:border-primary-500 dark:border-t-primary-300 rounded-full animate-spin" />
                      {t('schedule.saving')}
                    </>
                  ) : (
                    isEditing ? t('schedule.saveChanges') : t('schedule.addEvent')
                  )}
                </button>
              </div>
            </div>
          </form>
          )}

          {(readOnly || eventsForDay.length > 0) && (
            <div className={readOnly ? '' : 'mt-5 pt-5 border-t border-zinc-200 dark:border-zinc-700'}>
              <h3 className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 m-0 mb-3">
                {readOnly
                  ? (eventsForDay.length > 0 ? t('schedule.eventsOnThisDay', { count: eventsForDay.length }) : t('schedule.noEventsThisDay'))
                  : isEditing
                  ? t('schedule.otherEvents', { count: otherEventsForDay.length })
                  : t('schedule.eventsToday', { count: eventsForDay.length })}
              </h3>
              {(readOnly ? eventsForDay : (isEditing ? otherEventsForDay : eventsForDay)).length > 0 ? (
                <ul className="list-none p-0 m-0 flex flex-col gap-2">
                  {(readOnly ? eventsForDay : (isEditing ? otherEventsForDay : eventsForDay)).map((event) => (
                    <li
                      key={event.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    >
                      <div className="font-semibold text-primary-600 dark:text-primary-400 text-[13px] min-w-[45px]">
                        {formatTime(event.startTime)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <strong className="block font-medium text-zinc-800 dark:text-zinc-200 text-[13px] whitespace-nowrap overflow-hidden text-ellipsis">
                          {event.eventType?.name}
                        </strong>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">{event.placeName}</span>
                      </div>
                      <span
                        className={`text-[10px] py-0.5 px-2 rounded-full font-semibold uppercase tracking-wide ${getStatusBadgeClass(event.status)}`}
                      >
                        {getStatusLabel(event.status)}
                      </span>
                      {!readOnly && (
                        <>
                          <button
                            type="button"
                            className="flex items-center justify-center w-7 h-7 rounded-lg bg-transparent text-zinc-500 dark:text-zinc-400 hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 cursor-pointer transition-colors flex-shrink-0"
                            onClick={() => { setAssignStaffEvent(event); setAssignStaffId(''); setAssignStaffDropdownOpen(false); setAssignStaffError(null); }}
                            title={t('schedule.assignStaff')}
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="flex items-center justify-center w-7 h-7 rounded-lg bg-transparent text-zinc-500 dark:text-zinc-400 hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 cursor-pointer transition-colors flex-shrink-0"
                            onClick={() => onEditEvent?.(event)}
                            title={t('schedule.editThisEvent')}
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] italic text-zinc-400 dark:text-zinc-500 text-center py-4 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 m-0">
                  {t('schedule.noOtherEvents')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {!readOnly && assignStaffEvent && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 dark:bg-black/60 p-4" onClick={() => setAssignStaffEvent(null)}>
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-600 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark w-full max-w-md overflow-visible" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-600 bg-zinc-50/80 dark:bg-zinc-800/50 rounded-t-2xl">
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                {t('schedule.staffForEvent', { name: `${assignStaffEvent.eventType?.name ?? ''} – ${formatTime(assignStaffEvent.startTime)}` })}
              </h4>
              <button type="button" onClick={() => setAssignStaffEvent(null)} className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 transition-colors">
                <IconClose className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-4">
              {assignStaffError && (
                <div className="mb-3 flex items-center gap-2 py-2.5 px-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-[13px]">
                  {assignStaffError}
                </div>
              )}
              <div className="flex gap-2 flex-wrap items-center">
              <div className="relative flex-1 min-w-0 max-w-[220px]">
                <button
                  type="button"
                  onClick={() => setAssignStaffDropdownOpen((o) => !o)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm flex items-center justify-between gap-2 transition-colors ${assignStaffDropdownOpen ? 'border-primary-400 ring-2 ring-primary-400/20 dark:border-primary-500 dark:ring-primary-500/20' : 'border-zinc-200 dark:border-zinc-700'} bg-zinc-50/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none`}
                >
                  <span className={assignStaffId ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'}>
                    {selectedStaffDisplay ? `${selectedStaffDisplay.firstName} ${selectedStaffDisplay.lastName}` : t('schedule.selectStaff')}
                  </span>
                  <svg className={`w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 transition-transform ${assignStaffDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {assignStaffDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-[111]" aria-hidden onClick={() => setAssignStaffDropdownOpen(false)} />
                    <ul className="absolute left-0 right-0 top-full z-[112] mt-1 max-h-48 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 shadow-lg py-1">
                      {staffList.map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => { setAssignStaffId(s.id); setAssignStaffDropdownOpen(false); }}
                            className="w-full px-3 py-2 text-left text-sm text-zinc-800 dark:text-zinc-200 hover:bg-primary-50 dark:hover:bg-primary-500/20 transition-colors"
                          >
                            {s.firstName} {s.lastName}
                          </button>
                        </li>
                      ))}
                      {staffList.length === 0 && (
                        <li className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">{t('staff.noMembers')}</li>
                      )}
                    </ul>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={handleAssignStaff}
                disabled={!assignStaffId || assigningStaff}
                className="rounded-xl border border-primary-300 bg-primary-500/15 px-4 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-500/25 dark:border-primary-600 dark:bg-primary-500/20 dark:text-primary-200 dark:hover:bg-primary-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assigningStaff ? '…' : t('schedule.assignStaff')}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventModal;
