import React, { useState, useEffect } from 'react';
import { useI18n } from '../../../../context/I18nContext';

interface SlotItem {
  id?: string;
  availabilityId?: string;
  startTime: string;
  endTime: string;
  type?: string;
}

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  selectedAvailability: SlotItem | null;
  slotsForDay: SlotItem[];
  classesForDay: SlotItem[];
  onSave: (formData: { date: string; startTime: string; endTime: string }) => Promise<void>;
  onDelete: (availabilityId: string) => Promise<void>;
}

const formatLocalDate = (date: Date | null): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  selectedAvailability,
  slotsForDay,
  classesForDay,
  onSave,
  onDelete,
}) => {
  const { t, locale } = useI18n();
  const localeTag = locale === 'pl' ? 'pl-PL' : 'en-GB';
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    date: selectedDate ? formatLocalDate(selectedDate) : '',
    startTime: '08:00',
    endTime: '16:00',
  });

  useEffect(() => {
    if (selectedAvailability) {
      const date = new Date(selectedAvailability.startTime);
      const startTime = new Date(selectedAvailability.startTime);
      const endTime = new Date(selectedAvailability.endTime);

      setFormData({
        date: date.toISOString().split('T')[0],
        startTime: `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`,
        endTime: `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`,
      });
    } else {
      setFormData({
        date: selectedDate ? formatLocalDate(selectedDate) : '',
        startTime: '08:00',
        endTime: '16:00',
      });
    }
    setFormError(null);
  }, [selectedAvailability, selectedDate]);

  const isOverlapping = (startA: Date, endA: Date, startB: Date, endB: Date) => {
    return startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(localeTag, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getAvailabilityId = (slot: SlotItem | null): string | undefined => {
    if (!slot) return undefined;
    const s = slot as Record<string, unknown>;
    return (s.id ?? s.availabilityId ?? s.Id) as string | undefined;
  };

  const handleDeleteClick = async () => {
    const id = getAvailabilityId(selectedAvailability);
    if (!id) {
      setFormError(t('availability.deleteNoId'));
      return;
    }
    if (!window.confirm(t('availability.deleteConfirm'))) return;
    setFormError(null);
    setDeleting(true);
    try {
      await onDelete(id);
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string }; status?: number } };
      setFormError(e.response?.data?.message ?? (err instanceof Error ? err.message : t('availability.deleteNoId')));
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedDate) {
      setFormError(t('availability.errorNoDate'));
      return;
    }

    if (selectedAvailability) {
      setFormError(t('availability.errorEditingNotSupported'));
      return;
    }

    setSaving(true);

    try {
      const [startH, startM] = formData.startTime.split(':').map(Number);
      const [endH, endM] = formData.endTime.split(':').map(Number);

      if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
        setFormError(t('availability.errorInvalidTime'));
        return;
      }

      const startLocal = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        startH,
        startM,
        0,
        0
      );

      const endLocal = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        endH,
        endM,
        0,
        0
      );

      const overlappingSlots = slotsForDay.filter((slot) => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        return isOverlapping(startLocal, endLocal, slotStart, slotEnd);
      });

      const overlappingClasses = classesForDay.filter((cls) => {
        const classStart = new Date(cls.startTime);
        const classEnd = new Date(cls.endTime);
        return isOverlapping(startLocal, endLocal, classStart, classEnd);
      });

      if (endLocal.getTime() <= startLocal.getTime()) {
        setFormError(t('availability.errorEndBeforeStart'));
        return;
      }
      if (overlappingSlots.length > 0) {
        const conflicts = overlappingSlots
          .map((slot) => `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`)
          .join(', ');
        setFormError(t('availability.errorOverlapAvail', { conflicts }));
        return;
      }
      if (overlappingClasses.length > 0) {
        const conflicts = overlappingClasses
          .map((cls) => `${formatTime(cls.startTime)} - ${formatTime(cls.endTime)}`)
          .join(', ');
        setFormError(t('availability.errorOverlapClass', { conflicts }));
        return;
      }

      const payload = {
        date: formatLocalDate(selectedDate),
        startTime: `${formatLocalDate(selectedDate)}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`,
        endTime: `${formatLocalDate(selectedDate)}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`,
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  if (!isOpen) return null;

  const isDeleting = !!selectedAvailability;

  const slotsAndClassesForDay = [
    ...slotsForDay.map((slot) => ({ ...slot, type: 'availability' })),
    ...classesForDay.map((cls) => ({ ...cls, type: 'class' })),
  ].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const selectedId = getAvailabilityId(selectedAvailability);
  const slotsAndClassesForDayWithoutSelected = slotsForDay.filter(
    (slot) => !selectedId || getAvailabilityId(slot) !== selectedId
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-6"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-[480px] overflow-hidden border border-zinc-200 dark:border-zinc-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start px-6 py-5 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/50">
          <div className="flex items-start gap-3.5">
            <div className="flex items-center justify-center w-11 h-11 rounded-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex-shrink-0">
              <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="12" y1="14" x2="12" y2="18" />
                <line x1="10" y1="16" x2="14" y2="16" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 m-0 mb-0.5">
                {isDeleting ? t('availability.modalTitleDelete') : t('availability.modalTitleNew')}
              </h2>
              <p className="text-[13px] text-zinc-500 dark:text-zinc-400 m-0">
                {formatDate(selectedDate)}
              </p>
            </div>
          </div>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:hover:text-zinc-300 cursor-pointer transition-colors"
            onClick={onClose}
            aria-label={t('availability.close')}
          >
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-100px)]">
          {formError && (
            <div className="flex items-center gap-2 py-3 px-4 mb-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-[13px]">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="startTime" className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                {t('availability.startTime')}
              </label>
              {!isDeleting ? (
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  required
                  className="py-2.5 px-3.5 border border-zinc-200 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              ) : (
                <div className="py-2.5 px-3.5 border border-zinc-200 dark:border-zinc-600 rounded-lg text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                  {selectedAvailability && formatTime(selectedAvailability.startTime)}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="endTime" className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                {t('availability.endTime')}
              </label>
              {!isDeleting ? (
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  required
                  className="py-2.5 px-3.5 border border-zinc-200 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              ) : (
                <div className="py-2.5 px-3.5 border border-zinc-200 dark:border-zinc-600 rounded-lg text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                  {selectedAvailability && formatTime(selectedAvailability.endTime)}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center gap-3 pt-3 mt-2 border-t border-zinc-200 dark:border-zinc-700">
              {isDeleting && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={deleting || !getAvailabilityId(selectedAvailability)}
                  className="inline-flex items-center gap-1.5 py-2 px-3.5 border border-red-200 dark:border-red-800 rounded-xl bg-white dark:bg-zinc-900 text-red-600 dark:text-red-400 text-[13px] font-medium cursor-pointer transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  {deleting ? '…' : t('availability.delete')}
                </button>
              )}

              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-4 border border-zinc-200 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-[13px] font-medium cursor-pointer transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {t('availability.cancel')}
                </button>
                {!isDeleting && (
                  <button
                    type="submit"
                    disabled={saving || !selectedDate}
                    className="inline-flex items-center gap-2 rounded-xl border border-primary-300 bg-primary-500/15 px-4 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-500/25 dark:border-primary-600 dark:bg-primary-500/20 dark:text-primary-200 dark:hover:bg-primary-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('availability.addSlot')}
                  </button>
                )}
              </div>
            </div>
          </form>

          {slotsAndClassesForDay.length > 0 && (
            <div className="mt-5 pt-5 border-t border-zinc-200 dark:border-zinc-700">
              <h3 className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 m-0 mb-3">
                {isDeleting
                  ? t('availability.otherSlots', { count: slotsAndClassesForDayWithoutSelected.length })
                  : t('availability.slotsToday', { count: slotsAndClassesForDay.length })}
              </h3>
              {(isDeleting ? slotsAndClassesForDayWithoutSelected : slotsAndClassesForDay).length > 0 ? (
                <ul className="list-none p-0 m-0 flex flex-col gap-2">
                  {(isDeleting ? slotsAndClassesForDayWithoutSelected : slotsAndClassesForDay).map((slot, idx) => (
                    <li
                      key={(slot as SlotItem).id ?? (slot as SlotItem).availabilityId ?? `${slot.startTime}-${slot.endTime}-${idx}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    >
                      <div className="font-semibold text-primary-600 dark:text-primary-400 text-[13px] min-w-[45px]">
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <strong className="block font-medium text-zinc-800 dark:text-zinc-200 text-[13px]">
                          {slot.type === 'class' ? t('availability.slotTypeClass') : t('availability.slotTypeAvailability')}
                        </strong>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] italic text-zinc-400 dark:text-zinc-500 text-center py-4 px-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 m-0">
                  {t('availability.noOtherSlots')}
                </p>
              )}
              {!isDeleting && slotsForDay.length === 0 && (
                <p className="text-[13px] italic text-zinc-400 dark:text-zinc-500 text-center py-4 px-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 m-0 mt-2">
                  {t('availability.noSlotsToday')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailabilityModal;
