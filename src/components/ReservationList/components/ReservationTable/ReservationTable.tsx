import React, { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useI18n } from '../../../../context/I18nContext';
import { IconCalendar, IconUsers, IconClock, IconEdit, IconTrash, IconCheck, IconClose } from '../../../common/Icons/Icons';

interface Participant {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface EventSchedule {
  startTime?: string;
  placeName?: string;
  eventType?: { name?: string };
}

interface Reservation {
  id: string;
  status?: string;
  isPaid?: boolean;
  paidAt?: string | null;
  notes?: string;
  createdAt?: string;
  eventSchedule?: EventSchedule;
  participants?: Participant[];
}

interface ReservationTableProps {
  reservations: Reservation[];
  onEdit: (reservation: Reservation) => void;
  onDelete: (reservationId: string) => void;
  onMarkAsPaid: (reservationId: string) => void;
  onUnmarkAsPaid: (reservationId: string) => void;
  loading: boolean;
  onShowForm: () => void;
}

const MAX_VISIBLE_PARTICIPANTS = 2;

const ParticipantsModal: React.FC<{
  participants: Participant[];
  onClose: () => void;
  titleKey: string;
}> = ({ participants, onClose, titleKey }) => {
  const { t } = useI18n();
  const getInitials = (firstName?: string, lastName?: string) =>
    `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 dark:bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
          <h4 className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
            <IconUsers className="w-5 h-5 text-primary-500 dark:text-primary-400" />
            {t(titleKey)}
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
            aria-label={t('common.close')}
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
          {participants.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-zinc-100 dark:border-zinc-800 p-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300 text-sm font-medium">
                {getInitials(p.firstName, p.lastName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {p.firstName} {p.lastName}
                </p>
                {p.email && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{p.email}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const ParticipantsCell: React.FC<{
  participants?: Participant[];
  participantsTitleKey?: string;
}> = ({ participants, participantsTitleKey = 'reservations.participantsTitle' }) => {
  const { t } = useI18n();
  const [modalOpen, setModalOpen] = useState(false);

  const getInitials = (firstName?: string, lastName?: string) =>
    `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

  if (!participants || participants.length === 0) {
    return <span className="text-zinc-400 dark:text-zinc-500">—</span>;
  }

  const visible = participants.slice(0, MAX_VISIBLE_PARTICIPANTS);
  const restCount = participants.length - MAX_VISIBLE_PARTICIPANTS;
  const hasMore = restCount > 0;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((p) => (
        <span
          key={p.id}
          className="inline-flex items-center gap-1 py-0.5 pl-1.5 pr-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-medium"
        >
          <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300 text-[8px] font-bold">
            {getInitials(p.firstName, p.lastName)}
          </span>
          {p.firstName} {p.lastName}
        </span>
      ))}
      {hasMore && (
        <>
          <button
            type="button"
            className="inline-flex items-center gap-1 py-1 px-2 rounded-lg bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300 text-xs font-medium hover:bg-primary-200/50 dark:hover:bg-primary-500/30 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(true);
            }}
          >
            {t('reservations.viewAllParticipants', { count: participants.length })}
          </button>
          {modalOpen && (
            <ParticipantsModal
              participants={participants}
              onClose={() => setModalOpen(false)}
              titleKey={participantsTitleKey}
            />
          )}
        </>
      )}
    </div>
  );
};

const ReservationTable: React.FC<ReservationTableProps> = ({
  reservations,
  onEdit,
  onDelete,
  onMarkAsPaid,
  onUnmarkAsPaid,
  onShowForm,
}) => {
  const { t, locale } = useI18n();
  const { isTrainer } = useAuth();
  const localeTag = locale === 'pl' ? 'pl-PL' : 'en-US';

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return { date: '—', time: '' };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(localeTag, { year: 'numeric', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const getStatusClass = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300';
      case 'pending':
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400';
      case 'cancelled':
        return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400';
      default:
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return t('reservations.confirmed');
      case 'pending': return t('reservations.pending');
      case 'cancelled': return t('reservations.cancelled');
      default: return status || t('reservations.pending');
    }
  };

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="mb-4 h-14 w-14 text-primary-400 dark:text-primary-500">
          <IconCalendar className="h-full w-full" />
        </div>
        <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 m-0 mb-2">
          {t('reservations.noReservations')}
        </h4>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 m-0 mb-6">
          {t('reservations.noReservationsHint')}
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-primary-300 bg-primary-500/15 px-4 py-2.5 text-sm font-medium text-primary-700 dark:border-primary-600 dark:bg-primary-500/20 dark:text-primary-200 hover:bg-primary-500/25 dark:hover:bg-primary-500/30 transition-colors"
          onClick={(e) => handleAction(e, onShowForm)}
        >
          <IconCalendar className="w-4 h-4" />
          {t('reservations.createFirst')}
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
              {t('reservations.event')}
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
              {t('reservations.participants')}
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
              {t('reservations.status')}
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300 w-[120px] min-w-[120px]">
              {t('reservations.payment')}
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
              {t('reservations.notes')}
            </th>
            {!isTrainer() ? (
              <>
                <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                  {t('reservations.created')}
                </th>
                <th className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300 w-[200px] min-w-[200px]">
                  —
                </th>
              </>
            ) : (
              <th className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                {t('reservations.created')}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {reservations.map((reservation) => {
            const eventDateTime = formatDateTime(reservation.eventSchedule?.startTime);
            const createdAt = formatDateTime(reservation.createdAt);

            return (
              <tr
                key={reservation.id}
                className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors last:border-b-0"
              >
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {reservation.eventSchedule?.eventType?.name || '—'}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <IconCalendar className="w-3.5 h-3.5" />
                        {reservation.eventSchedule?.placeName || '—'}
                      </span>
                      <span className="flex items-center gap-1">
                        <IconClock className="w-3.5 h-3.5" />
                        {eventDateTime.date} {eventDateTime.time}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <ParticipantsCell participants={reservation.participants} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 py-1 px-2.5 rounded-xl text-xs font-medium ${getStatusClass(reservation.status)}`}
                  >
                    {getStatusLabel(reservation.status)}
                  </span>
                </td>
                <td className="px-4 py-3 w-[120px] min-w-[120px] align-top">
                  <div className="inline-flex min-w-[88px] min-h-[28px] flex-col items-start justify-center">
                    <span
                      className={`inline-flex items-center gap-1 py-1 px-2.5 rounded-xl text-xs font-medium whitespace-nowrap ${
                        reservation.isPaid
                          ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300'
                          : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {reservation.isPaid ? (
                        <><IconCheck className="w-3.5 h-3.5 shrink-0" /> {t('reservations.paid')}</>
                      ) : (
                        t('reservations.unpaid')
                      )}
                    </span>
                    {reservation.isPaid && reservation.paidAt && (
                      <span className="block text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {formatDateTime(reservation.paidAt).date}
                      </span>
                    )}
                  </div>
                </td>
                <td
                  className="px-4 py-3 max-w-[180px] min-w-[120px] text-zinc-500 dark:text-zinc-400 align-top cursor-help"
                  title={reservation.notes?.trim() ? reservation.notes : undefined}
                >
                  {reservation.notes?.trim() ? (
                    <span className="block truncate max-w-full">
                      {reservation.notes.length > 50 ? `${reservation.notes.slice(0, 50)}…` : reservation.notes}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                {!isTrainer() ? (
                  <td className="px-4 py-3">
                    <div>
                      <span className="block font-medium text-zinc-900 dark:text-zinc-100">{createdAt.date}</span>
                      <span className="block text-xs text-zinc-400 dark:text-zinc-500">{createdAt.time}</span>
                    </div>
                  </td>
                ) : (
                  <td className="px-4 py-3 text-right">
                    <div>
                      <span className="block font-medium text-zinc-900 dark:text-zinc-100">{createdAt.date}</span>
                      <span className="block text-xs text-zinc-400 dark:text-zinc-500">{createdAt.time}</span>
                    </div>
                  </td>
                )}
                {!isTrainer() && (
                  <td className="px-4 py-3 w-[200px] min-w-[200px] align-top">
                    <div className="flex flex-wrap gap-1 justify-end min-h-[28px]">
                      {reservation.isPaid ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                          onClick={(e) => handleAction(e, () => onUnmarkAsPaid(reservation.id))}
                        >
                          {t('reservations.unpaid')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-300 hover:bg-primary-200/50 dark:hover:bg-primary-500/30 transition-colors"
                          onClick={(e) => handleAction(e, () => onMarkAsPaid(reservation.id))}
                        >
                          <IconCheck className="w-3.5 h-3.5" /> {t('reservations.paid')}
                        </button>
                      )}
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                        onClick={(e) => handleAction(e, () => onEdit(reservation))}
                      >
                        <IconEdit className="w-3.5 h-3.5" /> {t('common.edit')}
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                        onClick={(e) => handleAction(e, () => onDelete(reservation.id))}
                      >
                        <IconTrash className="w-3.5 h-3.5" /> {t('common.delete')}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ReservationTable;
