import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../../context/I18nContext.tsx';
import { formatPhone } from '../../../utils/formatPhone.ts';
import EventCalendarSelector from './EventCalendarSelector.tsx';
import NewParticipantModal from './NewParticipantModal.tsx';
import Select from '../../common/Select.tsx';

interface Participant {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface ReservationFormProps {
  editingReservation: any | null;
  eventSchedules: any[];
  participants: Participant[];
  eventTypes: any[];
  onSubmit: (formData: {
    eventScheduleId: string;
    participantsIds: string[];
    notes: string;
    isPaid: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  onAddParticipant: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gdprConsent: boolean;
  }) => Promise<string | any>;
}

const inputClass =
  'w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all';

const closeBtnClass =
  'h-9 w-9 inline-flex items-center justify-center rounded-full text-outline hover:text-on-surface hover:bg-surface-variant transition-colors';

const sectionClass = 'rounded-xl border border-surface-variant bg-surface p-4 md:p-5';

const ReservationForm: React.FC<ReservationFormProps> = ({
                                                           editingReservation,
                                                           eventSchedules,
                                                           participants,
                                                           eventTypes,
                                                           onSubmit,
                                                           onCancel,
                                                           onAddParticipant,
                                                         }) => {
  const { t } = useI18n();

  const [formData, setFormData] = useState({
    eventScheduleId: editingReservation?.eventSchedule?.id || '',
    participantsIds:
      (editingReservation?.participants?.map((p: Participant) => p.id) as string[]) || [],
    notes: editingReservation?.notes || '',
    isPaid: editingReservation?.isPaid || false,
  });

  const [showNewParticipantModal, setShowNewParticipantModal] = useState(false);
  const [participantPickerValue, setParticipantPickerValue] = useState<string | number>('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notesTouched, setNotesTouched] = useState(false);

  useEffect(() => {
    setFormData({
      eventScheduleId: editingReservation?.eventSchedule?.id || '',
      participantsIds:
        (editingReservation?.participants?.map((p: Participant) => p.id) as string[]) || [],
      notes: editingReservation?.notes || '',
      isPaid: editingReservation?.isPaid || false,
    });
    setParticipantPickerValue('');
    setFormError(null);
    setShowNewParticipantModal(false);
    setNotesTouched(false);
  }, [editingReservation]);

  const getParticipantName = (p: Participant) =>
    [p.firstName, p.lastName].filter(Boolean).join(' ') || p.email || p.phone || '—';

  const getInitials = (firstName?: string, lastName?: string) =>
    `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';

  // Prosta, sprawdzona logika ze starego kodu
  const addedParticipants = participants.filter((p) =>
    formData.participantsIds.includes(p.id)
  );

  const availableParticipants = participants.filter(
    (p) => !formData.participantsIds.includes(p.id)
  );

  const participantOptions = useMemo(
    () =>
      availableParticipants.map((p) => ({
        value: p.id,
        label: [getParticipantName(p), p.email].filter(Boolean).join(' • '),
      })),
    [availableParticipants]
  );

  const notesEmpty = !formData.notes?.trim();

  const isValid =
    (!!editingReservation || (!!formData.eventScheduleId && formData.participantsIds.length > 0)) &&
    !notesEmpty;

  const handleEventSelect = (eventId: string) => {
    setFormData((prev) => ({ ...prev, eventScheduleId: eventId }));
  };

  const handleRemoveParticipant = (participantId: string) => {
    setFormData((prev) => ({
      ...prev,
      participantsIds: prev.participantsIds.filter((id) => id !== participantId),
    }));
  };

  const handleAddExistingParticipant = (value: string | number) => {
    const participantId = String(value || '');
    setParticipantPickerValue('');
    if (!participantId) return;
    setFormData((prev) => {
      if (prev.participantsIds.includes(participantId)) return prev;
      return { ...prev, participantsIds: [...prev.participantsIds, participantId] };
    });
  };

  // Dokładnie stara, działająca logika
  const handleNewParticipant = async (participantData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gdprConsent: boolean;
  }) => {
    try {
      const result = await onAddParticipant(participantData);
      if (result) {
        const id =
          typeof result === 'object' && result?.id != null ? result.id : result;
        setFormData((prev) => ({
          ...prev,
          participantsIds: [...prev.participantsIds, String(id)],
        }));
      }
      setShowNewParticipantModal(false);
    } catch (err) {
      throw err; // Przekazujemy błąd do modalu, żeby wyświetlił go inline
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setNotesTouched(true);

    if (!editingReservation && !formData.eventScheduleId) {
      setFormError(t('reservations.selectEventRequired'));
      return;
    }

    if (!editingReservation && formData.participantsIds.length === 0) {
      setFormError(t('reservations.addParticipantRequired'));
      return;
    }

    // Notatki wymagane, ale bez error-bannera
    if (notesEmpty) return;

    try {
      setSubmitting(true);
      await onSubmit({ ...formData, notes: formData.notes.trim() });
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Wystąpił błąd.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-surface-container-lowest md:rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] md:border border-surface-variant overflow-hidden min-h-screen md:min-h-0">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-surface-variant flex items-center justify-between gap-4 bg-surface-bright">
        <div>
          <h3 className="font-h3 text-h3 text-on-surface">
            {editingReservation ? t('reservations.edit') : t('reservations.createNew')}
          </h3>
        </div>
        <button type="button" onClick={onCancel} className={closeBtnClass} aria-label={t('common.close')}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">
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

        {/* Event */}
        {!editingReservation && (
          <div className={sectionClass}>
            <div className="mb-4">
              <div className="font-body-md text-body-md font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">event</span>
                {t('reservations.selectEvent')} <span className="text-error">*</span>
              </div>
            </div>
            <EventCalendarSelector
              eventSchedules={eventSchedules}
              eventTypes={eventTypes}
              selectedEventId={formData.eventScheduleId}
              onSelectEvent={handleEventSelect}
            />
          </div>
        )}

        {/* Participants */}
        {!editingReservation && (
          <div className={sectionClass}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="font-body-md text-body-md font-semibold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">group</span>
                  {t('reservations.participants')} <span className="text-error">*</span>
                </div>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  {t('reservations.addedParticipants')}: {addedParticipants.length}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="w-full sm:min-w-[320px]">
                  <Select
                    options={participantOptions}
                    value={participantPickerValue}
                    onChange={handleAddExistingParticipant}
                    placeholder={t('reservations.addParticipant')}
                    disabled={participantOptions.length === 0}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewParticipantModal(true)}
                  className="px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface font-label-bold text-label-bold hover:bg-surface-container-low transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  {t('reservations.addNewParticipant')}
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {addedParticipants.length > 0 ? (
                addedParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="rounded-xl border border-surface-variant bg-surface-container-low px-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0 font-label-bold text-label-bold text-xs">
                        {getInitials(participant.firstName, participant.lastName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-body-md text-body-md font-semibold text-on-surface">
                          {getParticipantName(participant)}
                        </div>
                        <div className="mt-1 flex flex-col gap-1">
                          {participant.email && (
                            <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                              <span className="material-symbols-outlined text-[16px]">mail</span>
                              <span className="truncate">{participant.email}</span>
                            </div>
                          )}
                          {participant.phone && (
                            <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                              <span className="material-symbols-outlined text-[16px]">call</span>
                              <span className="truncate">{formatPhone(participant.phone)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(participant.id)}
                        className="h-9 w-9 inline-flex items-center justify-center rounded-full text-outline hover:text-error hover:bg-error-container transition-colors shrink-0"
                        title={t('reservations.removeParticipant')}
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-surface-variant bg-surface-container-low px-6 py-10 text-center">
                  <span className="material-symbols-outlined text-[40px] text-outline mb-2">group_off</span>
                  <div className="font-body-md text-body-md font-semibold text-on-surface">
                    {t('reservations.noParticipantsAdded')}
                  </div>
                  <div className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                    {t('reservations.noParticipantsHint')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className={sectionClass}>
          <label className="font-body-md text-body-md font-semibold text-on-surface flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[18px]">notes</span>
            {t('reservations.notes')} <span className="text-error">*</span>
          </label>

          <textarea
            className={`${inputClass} min-h-[120px] resize-y`}
            placeholder={t('reservations.notesPlaceholder')}
            value={formData.notes}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, notes: e.target.value }));
              if (!notesTouched) setNotesTouched(true);
            }}
            onBlur={() => setNotesTouched(true)}
          />

          {notesTouched && notesEmpty && (
            <p className="mt-2 flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]">info</span>
              {t('reservations.notesRequired')}
            </p>
          )}
        </div>

        {/* isPaid */}
        {!editingReservation && (
          <div className={sectionClass}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary/20"
                checked={formData.isPaid}
                onChange={(e) => setFormData((prev) => ({ ...prev, isPaid: e.target.checked }))}
              />
              <div>
                <div className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  {formData.isPaid ? t('reservations.paid') : t('reservations.unpaid')}
                </div>
              </div>
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface font-label-bold text-label-bold hover:bg-surface-container-low transition-colors"
          >
            {t('common.cancel')}
          </button>

          <button
            type="submit"
            disabled={!isValid || submitting}
            className={`px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-bold text-label-bold hover:bg-primary-hover transition-colors inline-flex items-center justify-center gap-2 ${
              !isValid || submitting ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {submitting && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent" />
            )}
            {!submitting && (
              <span className="material-symbols-outlined text-[18px]">
                {editingReservation ? 'save' : 'event_available'}
              </span>
            )}
            {submitting
              ? t('reservations.saving')
              : editingReservation
                ? t('common.update')
                : t('reservations.createReservation')}
          </button>
        </div>
      </form>

      {showNewParticipantModal && (
        <NewParticipantModal
          onClose={() => setShowNewParticipantModal(false)}
          onSubmit={handleNewParticipant}
        />
      )}
    </div>
  );
};

export default ReservationForm;