import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  reservationApi,
  eventScheduleApi,
  participantApi,
  eventTypeApi,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import ErrorModal from '../common/ErrorModal.tsx';
import Pagination from '../common/Pagination.tsx';
import ReservationHeader from './components/ReservationHeader.tsx';
import ReservationForm from './components/ReservationForm.tsx';
import ReservationTable from './components/ReservationTable.tsx';

const ReservationList: React.FC = () => {
  const { t } = useI18n();
  const { selectedCompany } = useAuth();
  const companyId = selectedCompany?.id;
  const [searchParams, setSearchParams] = useSearchParams();

  const [reservations, setReservations] = useState<any[]>([]);
  const [eventSchedules, setEventSchedules] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingReservation, setEditingReservation] = useState<any>(null);

  const pageSize = 10;

  const currentPage = Math.max(0, parseInt(searchParams.get('page') || '1', 10) - 1);

  const fetchReservations = useCallback(async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await reservationApi.getAll(companyId, {
        page: currentPage,
        pageSize: pageSize,
      });

      const data = response.data as any;

      setReservations(data.items || []);
      setPagination({
        page: (data.page || 1) - 1,
        pageSize: data.pageSize || pageSize,
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (err: any) {
      console.error('Fetch error:', err.response?.data);
      setError(
        err.response?.data?.message || err.response?.data || err.message
      );
      setReservations([]);
      setPagination({
        page: 0,
        pageSize: pageSize,
        totalCount: 0,
        totalPages: 1,
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, currentPage, pageSize]);

  const fetchSupportingData = useCallback(async () => {
    if (!companyId) return;

    try {
      const [schedulesRes, participantsRes, eventTypesRes] = await Promise.all([
        eventScheduleApi.getAll(companyId, { page: 0, pageSize: 500 }),
        participantApi.getAll(companyId, { page: 0, pageSize: 500 }),
        eventTypeApi.getAll(companyId),
      ]);

      setEventSchedules(
        (schedulesRes.data as any)?.items ?? (schedulesRes.data as any) ?? []
      );
      setParticipants(
        (participantsRes.data as any)?.items ?? (participantsRes.data as any) ?? []
      );
      setEventTypes(
        (eventTypesRes.data as any)?.items ?? (eventTypesRes.data as any) ?? []
      );
    } catch (err) {
      console.error('Failed to fetch supporting data:', err);
    }
  }, [companyId]);

  const refreshReservations = async () => {
    if (!companyId) return;

    try {
      const response = await reservationApi.getAll(companyId, {
        page: currentPage,
        pageSize: pageSize,
      });

      const data = response.data as any;

      setReservations(data.items || []);
      setPagination({
        page: (data.page || 1) - 1,
        pageSize: data.pageSize || pageSize,
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (err) {
      console.error('Failed to refresh:', err);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchReservations();
      fetchSupportingData();
    }
  }, [fetchReservations, fetchSupportingData]);

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams();
    if (newPage > 0) {
      newParams.set('page', String(newPage + 1));
    }
    setSearchParams(newParams, { replace: false });
  };

  const handleSubmit = async (formData: {
    eventScheduleId: string;
    participantsIds: string[];
    notes: string;
    isPaid: boolean;
  }) => {
    try {
      setError(null);
      if (editingReservation) {
        await reservationApi.update(companyId!, editingReservation.id, {
          notes: formData.notes,
        });
      } else {
        await reservationApi.create(companyId!, {
          eventScheduleId: formData.eventScheduleId,
          participantsIds: formData.participantsIds,
          notes: formData.notes,
          isPaid: formData.isPaid,
        });
      }
      handleCloseForm();
      await refreshReservations();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  };

  const handleDelete = async (reservationId: string) => {
    if (!window.confirm(t('reservations.deleteConfirm')))
      return;

    const previousReservations = [...reservations];
    setReservations((prev) => prev.filter((r) => r.id !== reservationId));

    try {
      await reservationApi.delete(companyId!, reservationId);
      await refreshReservations();
    } catch (err: any) {
      setReservations(previousReservations);
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleMarkAsPaid = async (reservationId: string) => {
    const previousReservations = [...reservations];
    setReservations((prev) =>
      prev.map((r) =>
        r.id === reservationId
          ? { ...r, isPaid: true, paidAt: new Date().toISOString() }
          : r
      )
    );

    try {
      await reservationApi.markAsPaid(companyId!, reservationId);
      await refreshReservations();
    } catch (err: any) {
      setReservations(previousReservations);
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleUnmarkAsPaid = async (reservationId: string) => {
    const previousReservations = [...reservations];
    setReservations((prev) =>
      prev.map((r) =>
        r.id === reservationId ? { ...r, isPaid: false, paidAt: null } : r
      )
    );

    try {
      await reservationApi.unmarkAsPaid(companyId!, reservationId);
      await refreshReservations();
    } catch (err: any) {
      setReservations(previousReservations);
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleEdit = (reservation: any) => {
    setEditingReservation(reservation);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingReservation(null);
  };

  const handleAddParticipant = async (participantData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gdprConsent: boolean;
  }) => {
    try {
      const response = await participantApi.create(companyId!, participantData);
      const data = response.data as any;
      const id = data?.id ?? data?.Id ?? data;
      if (!id) return id;
      const byIdRes = await participantApi.getById(companyId!, String(id));
      const full = (byIdRes.data as any) ?? {};
      const participant = {
        id: String(id),
        firstName: full.firstName ?? full.FirstName ?? participantData.firstName,
        lastName: full.lastName ?? full.LastName ?? participantData.lastName,
        email: full.email ?? full.Email ?? participantData.email,
        phone: full.phone ?? full.Phone ?? participantData.phone,
      };
      setParticipants((prev) => (prev.some((p) => p.id === participant.id) ? prev : [...prev, participant]));
      return id;
    } catch (err) {
      throw err;
    }
  };

  if (loading && reservations.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white py-16 dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
        <div className="flex flex-col items-center justify-center gap-4 text-zinc-500 dark:text-zinc-400">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-primary-500 dark:border-zinc-600" />
          {t('reservations.loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ErrorModal error={error} onClose={() => setError(null)} />

      <ReservationHeader
        totalCount={pagination.totalCount}
        showForm={showForm}
        onToggleForm={() => (showForm ? handleCloseForm() : setShowForm(true))}
      />

      {showForm && (
        <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark overflow-hidden">
          <ReservationForm
            editingReservation={editingReservation}
            eventSchedules={eventSchedules}
            participants={participants}
            eventTypes={eventTypes}
            onSubmit={handleSubmit}
            onCancel={handleCloseForm}
            onAddParticipant={handleAddParticipant}
          />
        </div>
      )}

      {!showForm && (
        <>
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark overflow-hidden">
            <ReservationTable
              reservations={reservations}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMarkAsPaid={handleMarkAsPaid}
              onUnmarkAsPaid={handleUnmarkAsPaid}
              loading={loading}
              onShowForm={() => setShowForm(true)}
            />
          </div>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalCount={pagination.totalCount}
            pageSize={pagination.pageSize}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default ReservationList;
