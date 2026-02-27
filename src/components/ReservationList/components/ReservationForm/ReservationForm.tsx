import React, { useState } from 'react';
import { useI18n } from '../../../../context/I18nContext';
import { IconUsers, IconClose, IconCheck, IconAlert } from '../../../common/Icons/Icons';
import EventCalendarSelector from '../EventCalendarSelector/EventCalendarSelector';
import NewParticipantModal from '../NewParticipantModal/NewParticipantModal';

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

const formInput =
  'w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 text-zinc-900 placeholder-zinc-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-primary-500 dark:focus:ring-primary-500/20';

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
    participantsIds: (editingReservation?.participants?.map((p: Participant) => p.id) as string[]) || [],
    notes: editingReservation?.notes || '',
    isPaid: editingReservation?.isPaid || false,
  });

  const [showNewParticipantModal, setShowNewParticipantModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const addedParticipants = participants.filter((p) => formData.participantsIds.includes(p.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!editingReservation && !formData.eventScheduleId) {
      setFormError(t('reservations.selectEventRequired'));
      return;
    }

    if (!editingReservation && formData.participantsIds.length === 0) {
      setFormError(t('reservations.addParticipantRequired'));
      return;
    }

    if (!formData.notes?.trim()) {
      setFormError(t('reservations.notesRequired'));
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(formData);
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEventSelect = (eventId: string) => {
    setFormData((prev) => ({ ...prev, eventScheduleId: eventId }));
  };

  const handleRemoveParticipant = (participantId: string) => {
    setFormData((prev) => ({
      ...prev,
      participantsIds: prev.participantsIds.filter((id) => id !== participantId),
    }));
  };

  const handleNewParticipant = async (participantData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gdprConsent: boolean;
  }) => {
    try {
      const newId = await onAddParticipant(participantData);
      if (newId) {
        const id = typeof newId === 'object' && newId?.id != null ? newId.id : newId;
        setFormData((prev) => ({
          ...prev,
          participantsIds: [...prev.participantsIds, id],
        }));
      }
      setShowNewParticipantModal(false);
    } catch (err) {
      throw err;
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const isValid =
    (!!editingReservation || (!!formData.eventScheduleId && formData.participantsIds.length > 0)) &&
    !!formData.notes?.trim();

  return (
    <div className="p-6 bg-zinc-50/80 dark:bg-zinc-800/30 border-b border-zinc-200 dark:border-zinc-700">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 m-0 mb-4 pb-4 border-b border-zinc-200 dark:border-zinc-700">
          {editingReservation ? t('reservations.edit') : t('reservations.createNew')}
        </h4>

        {formError && (
          <div className="flex items-center justify-between gap-2 py-3 px-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
            <div className="flex items-center gap-2">
              <IconAlert className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm cursor-pointer transition-colors"
              onClick={() => setFormError(null)}
            >
              {t('reservations.dismiss')}
            </button>
          </div>
        )}

        {!editingReservation && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t('reservations.selectEvent')} <span className="text-red-500">*</span>
              </label>
              <EventCalendarSelector
                eventSchedules={eventSchedules}
                eventTypes={eventTypes}
                selectedEventId={formData.eventScheduleId}
                onSelectEvent={handleEventSelect}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t('reservations.participants')} <span className="text-red-500">*</span>
              </label>
              <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
                <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    <IconUsers className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                    {t('reservations.addedParticipants')}
                    {addedParticipants.length > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-primary-500/20 text-primary-600 dark:text-primary-300 rounded-lg">
                        {addedParticipants.length}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-primary-300 bg-primary-500/15 px-3 py-1.5 text-xs font-medium text-primary-700 dark:border-primary-600 dark:bg-primary-500/20 dark:text-primary-200 hover:bg-primary-500/25 dark:hover:bg-primary-500/30 transition-colors"
                    onClick={() => setShowNewParticipantModal(true)}
                  >
                    <IconUsers className="w-3.5 h-3.5" />
                    {t('reservations.addParticipant')}
                  </button>
                </div>

                <div className="max-h-[250px] overflow-y-auto">
                  {addedParticipants.length > 0 ? (
                    addedParticipants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-4 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 last:border-b-0 transition-colors"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300 text-sm font-semibold">
                          {getInitials(participant.firstName, participant.lastName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">
                            {participant.firstName} {participant.lastName}
                          </div>
                          <div className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{participant.email}</div>
                          <div className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{participant.phone}</div>
                        </div>
                        <button
                          type="button"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"
                          onClick={() => handleRemoveParticipant(participant.id)}
                          title={t('reservations.removeParticipant')}
                        >
                          <IconClose className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 px-6 text-center text-zinc-500 dark:text-zinc-400 gap-2">
                      <IconUsers className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                      <span className="text-sm">{t('reservations.noParticipantsAdded')}</span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">{t('reservations.noParticipantsHint')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl cursor-pointer bg-white dark:bg-zinc-900">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-zinc-300 text-primary-500 focus:ring-primary-400"
                checked={formData.isPaid}
                onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
              />
              <span className="text-sm text-zinc-800 dark:text-zinc-200 cursor-pointer">{t('reservations.markAsPaid')}</span>
            </label>
          </>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('reservations.notes')} *</label>
          <textarea
            className={`${formInput} min-h-[80px] resize-y`}
            placeholder={t('reservations.notesPlaceholder')}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            required
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700 mt-4">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl border border-primary-300 bg-primary-500/15 px-4 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-500/25 dark:border-primary-600 dark:bg-primary-500/20 dark:text-primary-200 dark:hover:bg-primary-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isValid || submitting}
          >
            {submitting ? (
              t('reservations.saving')
            ) : (
              <>
                <IconCheck className="w-4 h-4" />
                {editingReservation ? t('common.update') : t('reservations.createReservation')}
              </>
            )}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
            onClick={onCancel}
          >
            {t('common.cancel')}
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
