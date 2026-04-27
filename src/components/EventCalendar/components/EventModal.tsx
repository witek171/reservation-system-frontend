import React, { useState, useEffect } from 'react';
import { useI18n } from '../../../context/I18nContext.tsx';
import { staffMemberApi } from '../../../services/api.ts';
import { extractErrorMessage } from '../../../utils/errorUtils.ts';
import { formatToPolishTime } from '../../../utils/formatDate.ts';
import { getEventTypeColor } from '../../../utils/colorUtils.ts';
import ModalPortal from '../../common/ModalPortal.tsx';
import Select from '../../common/Select.tsx';

interface EventTypeItem {
  id: string;
  name: string;
  duration?: number;
  price?: number;
}

interface CalendarEvent {
  id: string;
  startTime: string;
  endTime?: string;
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

const inputClass =
  'w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-body-sm text-body-sm';

const closeBtnClass =
  'h-9 w-9 inline-flex items-center justify-center rounded-full text-outline hover:text-on-surface hover:bg-surface-variant transition-colors';

const EventModal: React.FC<EventModalProps> = ({
                                                 isOpen, onClose, companyId, selectedDate, selectedEvent, eventTypes,onSave, onDelete,
                                                 readOnly = false,
                                               }) => {
  const { t } = useI18n();
  const isEditing = !!selectedEvent;

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [assignStaffEvent, setAssignStaffEvent] = useState<CalendarEvent | null>(null);
  const [staffList, setStaffList] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [assignStaffId, setAssignStaffId] = useState('');
  const [assigningStaff, setAssigningStaff] = useState(false);
  const [assignStaffError, setAssignStaffError] = useState<string | null>(null);

  const [formData, setFormData] = useState({ eventTypeId: '', placeName: '', time: '09:00' });

  useEffect(() => {
    if (selectedEvent) {
      const warsawTime = new Date(
        new Date(selectedEvent.startTime).toLocaleString('en-US', { timeZone: 'Europe/Warsaw' })
      );
      setFormData({
        eventTypeId: selectedEvent.eventType?.id || '',
        placeName: selectedEvent.placeName || '',
        time: `${String(warsawTime.getHours()).padStart(2, '0')}:${String(warsawTime.getMinutes()).padStart(2, '0')}`,
      });
    } else {
      setFormData({ eventTypeId: '', placeName: '', time: '09:00' });
    }
    setFormError(null);
  }, [selectedEvent, selectedDate]);

  useEffect(() => {
    if (!companyId || !assignStaffEvent) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await staffMemberApi.getAll(companyId, { page: 0, pageSize: 500 });
        if (!cancelled) setStaffList((res.data as any)?.items || []);
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
      setAssignStaffEvent(null);
    } catch (err: unknown) {
      setAssignStaffError(extractErrorMessage((err as any)?.response?.data ?? err));
    } finally {
      setAssigningStaff(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) { setFormError(t('schedule.noDate')); return; }
    setSaving(true);
    setFormError(null);
    try {
      const [hours, minutes] = formData.time.split(':').map(Number);
      const eventDateTime = new Date(
        selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(),
        hours, minutes, 0, 0
      );
      if (isNaN(eventDateTime.getTime())) {
        setFormError(t('schedule.invalidDate'));
        setSaving(false);
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

  const formatDateHeader = (d: Date | null) => {
    if (!d) return t('schedule.noDate');
    return d.toLocaleDateString('pl-PL', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const eventTypeOptions = eventTypes.map((type) => ({
    value: type.id,
    label: `${type.name}${type.duration ? ` (${type.duration} min)` : ''}${type.price ? ` · ${type.price} PLN` : ''}`,
  }));

  const staffOptions = staffList.map((s) => ({
    value: s.id,
    label: `${s.firstName} ${s.lastName}`,
  }));

  if (!isOpen) return null;

  const showEventInfo = isEditing && selectedEvent;
  const eventColor = showEventInfo ? getEventTypeColor(selectedEvent.eventType?.id || '') : null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-lg rounded-2xl border border-surface-variant bg-surface-container-lowest shadow-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-surface-variant flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">
                  {isEditing ? 'edit' : 'add'}
                </span>
              </div>
              <div>
                <h3 className="font-h3 text-h3 text-on-surface">
                  {isEditing ? t('schedule.editEvent') : t('schedule.newEvent')}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">event</span>
                  {formatDateHeader(selectedDate)}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className={closeBtnClass}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Event info card when editing */}
            {showEventInfo && eventColor && (
              <div className={`rounded-xl border p-4 space-y-2 ${eventColor.bg} ${eventColor.borderClass}`}>
                <span className="font-body-md text-body-md font-semibold text-on-surface">
                  {selectedEvent.eventType?.name || '—'}
                </span>
                <div className="flex flex-wrap items-center gap-3 font-body-sm text-body-sm text-on-surface-variant">
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    {formatToPolishTime(selectedEvent.startTime).time}
                    {selectedEvent.endTime && ` – ${formatToPolishTime(selectedEvent.endTime).time}`}
                  </span>
                  {selectedEvent.placeName && (
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {selectedEvent.placeName}
                    </span>
                  )}
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      setAssignStaffEvent(selectedEvent);
                      setAssignStaffId('');
                      setAssignStaffError(null);
                    }}
                    className="mt-1 px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface font-label-bold text-label-bold hover:bg-surface-container-low transition-colors inline-flex items-center gap-1.5 text-sm bg-white/80"
                  >
                    <span className="material-symbols-outlined text-[16px]">person_add</span>
                    {t('schedule.assignStaff')}
                  </button>
                )}
              </div>
            )}

            {/* Error */}
            {formError && (
              <div className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-on-error-container">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] mt-0.5">error</span>
                    <span className="font-body-sm text-body-sm">{formError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormError(null)}
                    className="text-on-error-container/80 hover:text-on-error-container"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              </div>
            )}

            {/* Form */}
            {!readOnly && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="font-body-sm text-body-sm text-on-surface font-medium">
                    {t('schedule.eventType')} <span className="text-error">*</span>
                  </label>
                  <Select
                    options={eventTypeOptions}
                    value={formData.eventTypeId}
                    onChange={(v) => setFormData((p) => ({ ...p, eventTypeId: String(v) }))}
                    placeholder={t('schedule.selectEventType')}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-body-sm text-body-sm text-on-surface font-medium">
                    {t('schedule.location')} <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.placeName}
                    onChange={(e) => setFormData((p) => ({ ...p, placeName: e.target.value }))}
                    placeholder={t('schedule.locationPlaceholder')}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-body-sm text-body-sm text-on-surface font-medium">
                    {t('schedule.startTime')} <span className="text-error">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData((p) => ({ ...p, time: e.target.value }))}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-surface-variant">
                  {isEditing && onDelete && (
                    <button
                      type="button"
                      onClick={() => selectedEvent && onDelete(selectedEvent.id)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-error text-error font-label-bold text-label-bold hover:bg-error-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      {t('schedule.delete')}
                    </button>
                  )}
                  <div className="flex gap-3 ml-auto">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface font-label-bold text-label-bold hover:bg-surface-container-low transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !selectedDate}
                      className={`px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-bold text-label-bold hover:bg-primary/90 transition-colors inline-flex items-center gap-2 ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent" />}
                      <span className="material-symbols-outlined text-[18px]">{isEditing ? 'save' : 'add'}</span>
                      {saving ? t('schedule.saving') : isEditing ? t('schedule.saveChanges') : t('schedule.addEvent')}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Assign staff */}
      {!readOnly && assignStaffEvent && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setAssignStaffEvent(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-surface-variant bg-surface-container-lowest shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-surface-variant flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                </div>
                <div>
                  <h3 className="font-h3 text-h3 text-on-surface">{t('schedule.assignStaff')}</h3>
                  <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
                    {assignStaffEvent.eventType?.name} · {formatToPolishTime(assignStaffEvent.startTime).time}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setAssignStaffEvent(null)} className={closeBtnClass}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-5">
              {assignStaffError && (
                <div className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-on-error-container font-body-sm text-body-sm flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] mt-0.5">error</span>
                  {assignStaffError}
                </div>
              )}
              <Select
                options={staffOptions}
                value={assignStaffId}
                onChange={(v) => setAssignStaffId(String(v))}
                placeholder={t('schedule.selectStaff')}
              />
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-surface-variant">
                <button
                  type="button"
                  onClick={() => setAssignStaffEvent(null)}
                  className="px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface font-label-bold text-label-bold hover:bg-surface-container-low transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleAssignStaff}
                  disabled={!assignStaffId || assigningStaff}
                  className={`flex-1 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-bold text-label-bold hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2 ${!assignStaffId || assigningStaff ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {assigningStaff && <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent" />}
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  {t('schedule.assignStaff')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModalPortal>
  );
};

export default EventModal;