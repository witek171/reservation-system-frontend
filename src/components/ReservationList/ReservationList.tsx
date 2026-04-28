import React, {useState, useEffect, useCallback, useRef} from 'react';
import {useSearchParams} from 'react-router-dom';
import {reservationApi, participantApi, eventScheduleApi, eventTypeApi} from '../../services/api';
import {useAuth} from '../../context/AuthContext';
import {useI18n} from '../../context/I18nContext';
import ErrorModal from '../common/ErrorModal.tsx';
import ModalPortal from '../common/ModalPortal.tsx';
import Pagination from '../common/Pagination.tsx';
import SearchBar from '../common/SearchBar.tsx';
import {formatToPolishTime} from '../../utils/formatDate.ts';
import {formatPhone} from '../../utils/formatPhone.ts';
import ReservationForm from './components/ReservationForm.tsx';

const MAX_PARTICIPANTS_VISIBLE = 2;

interface ParticipantRef {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface ReservationItem {
  id: string;
  eventSchedule?: {
    id?: string;
    startTime?: string;
    eventType?: { id?: string; name?: string; price?: number };
  };
  participants?: ParticipantRef[];
  notes?: string;
  isPaid?: boolean;
  paidAt?: string | null;
  createdAt?: string;
  status?: string;
}

interface FormResources {
  eventSchedules: any[];
  participants: any[];
  eventTypes: any[];
}

const pageSize = 10;

const ReservationList: React.FC = () => {
  const {t} = useI18n();
  const {selectedCompany, isTrainer} = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const companyId = selectedCompany?.id;

  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | { message?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [pagination, setPagination] = useState({page: 0, pageSize, totalCount: 0, totalPages: 1});

  const [actionsDropdownOpen, setActionsDropdownOpen] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [mobileActionsReservation, setMobileActionsReservation] = useState<ReservationItem | null>(null);

  const [detailReservation, setDetailReservation] = useState<ReservationItem | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [togglingPaid, setTogglingPaid] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formResources, setFormResources] = useState<FormResources>({
    eventSchedules: [],
    participants: [],
    eventTypes: [],
  });
  const [formResourcesLoading, setFormResourcesLoading] = useState(false);
  const [formResourcesError, setFormResourcesError] = useState<string | null>(null);

  const listTopRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToTopRef = useRef(false);
  const currentPage = Math.max(0, parseInt(searchParams.get('page') || '1', 10) - 1);

  const modalType = searchParams.get('modal');
  const modalId = searchParams.get('id');

  const closeDropdown = useCallback(() => {
    setActionsDropdownOpen(null);
    setDropdownPosition(null);
  }, []);

  const normalizeCompare = (value?: string) => (value || '').trim().toLowerCase();

  const normalizePhoneCompare = (value?: string) =>
    (value || '').replace(/[^\d+]/g, '');

  const extractParticipantId = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);

    return String(
      value.id ??
      value.Id ??
      value.ID ??
      value.participantId ??
      value.ParticipantId ??
      value.participant?.id ??
      value.participant?.Id ??
      value.data?.id ??
      value.data?.Id ??
      ''
    );
  };

  const getName = (p: ParticipantRef) =>
    [p.firstName, p.lastName].filter(Boolean).join(' ') || '—';

  const getInitials = (p: ParticipantRef) =>
    `${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`.toUpperCase() || '?';

  // ── Detail modal ──
  const openDetailModal = useCallback(
    (r: ReservationItem) => {
      const p = new URLSearchParams(searchParams);
      p.set('modal', 'detail');
      p.set('id', r.id);
      setDetailReservation(r);
      setNotesValue(r.notes || '');
      setEditingNotes(false);
      closeDropdown();
      setMobileActionsReservation(null);
      setSearchParams(p, {replace: false});
    },
    [searchParams, setSearchParams, closeDropdown]
  );

  const closeDetailModal = useCallback(() => {
    const p = new URLSearchParams(searchParams);
    p.delete('modal');
    p.delete('id');
    setDetailReservation(null);
    setEditingNotes(false);
    setNotesValue('');
    setSearchParams(p, {replace: true});
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!companyId) return;
    if (modalType !== 'detail') {
      setDetailReservation(null);
      return;
    }
    if (!modalId) return;
    const found = reservations.find((r) => r.id === modalId);
    if (found) {
      setDetailReservation(found);
      setNotesValue(found.notes || '');
    }
  }, [companyId, modalType, modalId, reservations]);

  // ── Fetch ──
  const fetchReservations = useCallback(async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      setError(null);
      const params: any = {page: currentPage, pageSize};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await reservationApi.getAll(companyId, params);
      const data = res.data as any;
      setReservations(data.items || []);
      setPagination({
        page: currentPage,
        pageSize: data.pageSize || pageSize,
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.response?.data ?? err.message ?? null);
      setReservations([]);
      setPagination({page: 0, pageSize, totalCount: 0, totalPages: 1});
    } finally {
      setLoading(false);
    }
  }, [companyId, currentPage, searchQuery]);

  useEffect(() => {
    if (companyId) fetchReservations();
  }, [fetchReservations, companyId]);

  useEffect(() => {
    if (!shouldScrollToTopRef.current || loading) return;
    shouldScrollToTopRef.current = false;
    requestAnimationFrame(() => {
      listTopRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
    });
  }, [loading, pagination.page]);

  useEffect(() => {
    const p = new URLSearchParams(searchParams);
    if (searchQuery.trim()) p.set('search', searchQuery.trim());
    else p.delete('search');
    p.delete('page');
    setSearchParams(p, {replace: true});
  }, [searchQuery]);

  useEffect(() => {
    if (!actionsDropdownOpen) return;
    const close = () => closeDropdown();
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [actionsDropdownOpen, closeDropdown]);

  const handlePageChange = (newPage: number) => {
    shouldScrollToTopRef.current = true;
    const p = new URLSearchParams(searchParams);
    if (newPage > 0) p.set('page', String(newPage + 1));
    else p.delete('page');
    if (searchQuery.trim()) p.set('search', searchQuery.trim());
    else p.delete('search');
    setSearchParams(p, {replace: false});
  };

  const refreshReservations = async () => {
    if (!companyId) return;
    try {
      const params: any = {page: currentPage, pageSize};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await reservationApi.getAll(companyId, params);
      const data = res.data as any;
      setReservations(data.items || []);
      setPagination({
        page: currentPage,
        pageSize: data.pageSize || pageSize,
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (_) {
    }
  };

  const updateInState = (id: string, patch: Partial<ReservationItem>) => {
    setReservations((all) => all.map((r) => (r.id === id ? {...r, ...patch} : r)));
    setDetailReservation((prev) => (prev && prev.id === id ? {...prev, ...patch} : prev));
  };

  // ── Form resources ──
  const fetchFormResources = useCallback(async () => {
    if (!companyId) return;
    try {
      setFormResourcesLoading(true);
      setFormResourcesError(null);
      const [schedulesRes, participantsRes, eventTypesRes] = await Promise.all([
        eventScheduleApi.getAll(companyId, {pageSize: 200}),
        participantApi.getAll(companyId, {pageSize: 500}),
        eventTypeApi.getAll(companyId, {pageSize: 200}),
      ]);
      const s = schedulesRes.data as any;
      const p = participantsRes.data as any;
      const e = eventTypesRes.data as any;
      setFormResources({
        eventSchedules: s?.items ?? s ?? [],
        participants: p?.items ?? p ?? [],
        eventTypes: e?.items ?? e ?? [],
      });
    } catch (err: any) {
      setFormResourcesError(
        err?.response?.data?.message ?? err?.message ?? 'Nie udało się załadować danych.'
      );
    } finally {
      setFormResourcesLoading(false);
    }
  }, [companyId]);

  const openCreateModal = useCallback(() => {
    setShowCreateModal(true);
    fetchFormResources();
  }, [fetchFormResources]);

  const closeCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setFormResourcesError(null);
  }, []);

  const handleCreateReservation = async (formData: {
    eventScheduleId: string;
    participantsIds: string[];
    notes: string;
    isPaid: boolean;
  }) => {
    if (!companyId) return;
    await reservationApi.create(companyId, formData);
    closeCreateModal();
    await refreshReservations();
  };

  const handleAddParticipant = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gdprConsent: boolean;
  }) => {
    if (!companyId) throw new Error('Brak firmy');

    // 1. Create participant
    const res = await participantApi.create(companyId, data);
    const created = res.data as any;

    // 2. Try to extract real id from response
    let participantId = extractParticipantId(created);

    let participant: ParticipantRef | null = participantId
      ? {
        id: participantId,
        firstName:
          created?.firstName ??
          created?.FirstName ??
          created?.participant?.firstName ??
          created?.participant?.FirstName ??
          data.firstName,
        lastName:
          created?.lastName ??
          created?.LastName ??
          created?.participant?.lastName ??
          created?.participant?.LastName ??
          data.lastName,
        email:
          created?.email ??
          created?.Email ??
          created?.participant?.email ??
          created?.participant?.Email ??
          data.email,
        phone:
          created?.phone ??
          created?.Phone ??
          created?.participant?.phone ??
          created?.participant?.Phone ??
          data.phone,
      }
      : null;

    // 3. Fallback: if create response did not contain usable id,
    // fetch participants and find the newly created one
    if (!participant) {
      const listRes = await participantApi.getAll(companyId, {
        pageSize: 500,
        search: data.email,
      });

      const listData = listRes.data as any;
      const items = listData?.items ?? listData ?? [];

      const found = items.find((p: any) => {
        const sameEmail =
          normalizeCompare(p.email ?? p.Email) === normalizeCompare(data.email);

        const sameFirstName =
          normalizeCompare(p.firstName ?? p.FirstName) === normalizeCompare(data.firstName);

        const sameLastName =
          normalizeCompare(p.lastName ?? p.LastName) === normalizeCompare(data.lastName);

        const samePhone =
          normalizePhoneCompare(p.phone ?? p.Phone) === normalizePhoneCompare(data.phone);

        return sameEmail && sameFirstName && sameLastName && samePhone;
      });

      const foundId = extractParticipantId(found);

      if (!found || !foundId) {
        throw new Error(
          'Uczestnik został utworzony, ale nie udało się pobrać jego identyfikatora.'
        );
      }

      participant = {
        id: foundId,
        firstName: found.firstName ?? found.FirstName ?? data.firstName,
        lastName: found.lastName ?? found.LastName ?? data.lastName,
        email: found.email ?? found.Email ?? data.email,
        phone: found.phone ?? found.Phone ?? data.phone,
      };
    }

    // 4. Update local resources for form
    setFormResources((prev) => {
      const exists = prev.participants.some(
        (p: any) => String(p.id ?? p.Id) === String(participant!.id)
      );

      if (exists) return prev;

      return {
        ...prev,
        participants: [...prev.participants, participant],
      };
    });

    // 5. Return real participant with real backend id
    return participant;
  };

  // ── Actions ──
  const handleDelete = async (r: ReservationItem) => {
    if (!companyId || !window.confirm(t('reservations.deleteConfirm'))) return;
    const prev = [...reservations];
    setReservations((all) => all.filter((x) => x.id !== r.id));
    closeDropdown();
    setMobileActionsReservation(null);
    if (detailReservation?.id === r.id) closeDetailModal();
    try {
      setError(null);
      await reservationApi.delete(companyId, r.id);
      await refreshReservations();
    } catch (err: any) {
      setReservations(prev);
      setError(err.response?.data?.message ?? err.response?.data ?? err.message ?? null);
    }
  };

  const handleTogglePaid = async (r: ReservationItem) => {
    if (!companyId || togglingPaid) return;
    const wasPaid = r.isPaid;
    setTogglingPaid(true);
    updateInState(r.id, {isPaid: !wasPaid, paidAt: !wasPaid ? new Date().toISOString() : null});
    closeDropdown();
    setMobileActionsReservation(null);
    try {
      if (wasPaid) await reservationApi.unmarkAsPaid(companyId, r.id);
      else await reservationApi.markAsPaid(companyId, r.id);
      await refreshReservations();
    } catch (err: any) {
      updateInState(r.id, {isPaid: wasPaid, paidAt: r.paidAt});
      setError(err.response?.data?.message ?? err.response?.data ?? err.message ?? null);
    } finally {
      setTogglingPaid(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!companyId || !detailReservation) return;
    try {
      setSavingNotes(true);
      setError(null);
      await reservationApi.update(companyId, detailReservation.id, {notes: notesValue});
      updateInState(detailReservation.id, {notes: notesValue});
      setEditingNotes(false);
      await refreshReservations();
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.response?.data ?? err.message ?? null);
    } finally {
      setSavingNotes(false);
    }
  };

  const PaidBadge = ({r, sm}: { r: ReservationItem; sm?: boolean }) => {
    const paidDate = r.paidAt ? formatToPolishTime(r.paidAt) : null;
    return (
      <div className="flex flex-col gap-0.5">
        {r.isPaid ? (
          <span
            className={`inline-flex items-center rounded-full bg-surface-container-low border border-outline-variant font-label-bold text-label-bold text-on-surface w-fit ${sm ? 'gap-1 px-2.5 py-0.5 text-xs' : 'gap-1.5 px-3 py-1'}`}>
            <span
              className={`material-symbols-outlined text-secondary ${sm ? 'text-[12px]' : 'text-[14px]'}`}>check_circle</span>
            {t('reservations.paid')}
          </span>
        ) : (
          <span
            className={`inline-flex items-center rounded-full bg-error-container border border-error/20 font-label-bold text-label-bold text-on-error-container w-fit ${sm ? 'gap-1 px-2.5 py-0.5 text-xs' : 'gap-1.5 px-3 py-1'}`}>
            <span className={`material-symbols-outlined ${sm ? 'text-[12px]' : 'text-[14px]'}`}>cancel</span>
            {t('reservations.unpaid')}
          </span>
        )}
        {paidDate && (
          <span className={`font-body-sm text-on-surface-variant ${sm ? 'text-[11px]' : 'text-body-sm'}`}>
            {paidDate.date}, {paidDate.time}
          </span>
        )}
      </div>
    );
  };

  const ParticipantChips = ({participants, onShowAll}: { participants?: ParticipantRef[]; onShowAll: () => void }) => {
    if (!participants || participants.length === 0) return <span
      className="font-body-sm text-body-sm text-outline">—</span>;
    return (
      <div className="flex flex-wrap gap-1.5">
        {participants.slice(0, MAX_PARTICIPANTS_VISIBLE).map((p) => (
          <span key={p.id}
                className="px-2 py-1 bg-surface border border-outline-variant rounded text-xs text-on-surface-variant">
            {getName(p)}
          </span>
        ))}
        {participants.length > MAX_PARTICIPANTS_VISIBLE && (
          <button type="button" onClick={(e) => {
            e.stopPropagation();
            onShowAll();
          }}
                  className="px-2 py-1 bg-surface border border-outline-variant rounded text-xs text-on-surface-variant hover:bg-surface-container-low">
            +{participants.length - MAX_PARTICIPANTS_VISIBLE}
          </button>
        )}
      </div>
    );
  };

  if (loading && reservations.length === 0) {
    return (
      <div className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-8">
        <div className="flex items-center justify-center gap-3 text-on-surface-variant">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-outline-variant border-t-primary"/>
          {t('loading')}
        </div>
      </div>
    );
  }

  const closeBtnClass = 'h-9 w-9 inline-flex items-center justify-center rounded-full text-outline hover:text-on-surface hover:bg-surface-variant transition-colors';

  return (
    <div className="space-y-6">
      {error && <ErrorModal error={error} onClose={() => setError(null)}/>}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-h2 text-h2 text-on-surface">{t('reservations.title')}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">{t('reservations.subtitle')}</p>
        </div>
        {!isTrainer() && (
          <button
            type="button"
            onClick={openCreateModal}
            className="bg-secondary hover:bg-secondary-fixed-variant text-on-secondary font-label-bold text-label-bold py-3 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {t('reservations.add')}
          </button>
        )}
      </div>

      {/* Table Card */}
      <div ref={listTopRef}
           className="w-full bg-surface-container-lowest rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-surface-variant overflow-hidden scroll-mt-24">
        <div className="p-4 md:p-6 border-b border-surface-variant flex flex-col gap-4 bg-surface-bright">
          <SearchBar className="w-full sm:w-96" value={searchQuery} onChange={setSearchQuery}
                     onClear={() => setSearchQuery('')} placeholder={t('reservations.search')} debounceMs={300}
                     maxLength={100} loading={loading && searchQuery.trim() !== ''}
                     resultCount={searchQuery.trim() ? pagination.totalCount : null}/>
        </div>

        {/* Desktop Table */}
        <div className="overflow-x-auto">
          <table className="hidden md:table w-full text-left border-collapse">
            <thead>
            <tr className="border-b border-surface-variant bg-surface-container-low">
              <th
                className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">{t('reservations.participants')}</th>
              <th
                className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">{t('reservations.event')}</th>
              <th
                className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">{t('reservations.status')}</th>
              <th
                className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">{t('reservations.notes')}</th>
              <th
                className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">{t('participants.created')}</th>
              {!isTrainer() && <th
                className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-right whitespace-nowrap">Akcje</th>}
            </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
            {reservations.map((r) => {
              const {date, time} = formatToPolishTime(r.createdAt);
              return (
                <tr key={r.id} className="hover:bg-surface-container-low transition-colors group cursor-pointer"
                    onClick={() => openDetailModal(r)}>
                  <td className="py-4 px-6">
                    <ParticipantChips participants={r.participants} onShowAll={() => openDetailModal(r)}/>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">event</span>
                      </div>
                      <div>
                        <div
                          className="font-body-md text-body-md text-on-surface font-semibold">{r.eventSchedule?.eventType?.name || '—'}</div>
                        {r.eventSchedule?.startTime && (() => {
                          const {date: d, time: tm} = formatToPolishTime(r.eventSchedule!.startTime);
                          return <div
                            className="flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>{d}, {tm}</div>;
                        })()}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6"><PaidBadge r={r}/></td>
                  <td className="py-4 px-6 max-w-[200px]">
                    <span className="font-body-sm text-body-sm text-on-surface-variant block truncate"
                          title={r.notes}>{r.notes || '—'}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-body-sm text-body-sm text-on-surface">{date}</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">{time}</span>
                    </div>
                  </td>
                  {!isTrainer() && (
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => {
                        e.stopPropagation();
                        if (actionsDropdownOpen === r.id) closeDropdown();
                        else {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setDropdownPosition({top: rect.bottom + 4, left: rect.right - 208});
                          setActionsDropdownOpen(r.id);
                        }
                      }}
                              className="text-outline hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-variant inline-flex items-center justify-center">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-surface-variant">
          {reservations.map((r) => {
            const {date, time} = formatToPolishTime(r.createdAt);
            return (
              <div key={r.id} className="p-4 cursor-pointer" onClick={() => openDetailModal(r)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">event</span>
                    </div>
                    <div>
                      <div
                        className="font-body-md text-body-md text-on-surface font-semibold">{r.eventSchedule?.eventType?.name || '—'}</div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">{date} {time}</div>
                    </div>
                  </div>
                  {!isTrainer() && (
                    <button onClick={(e) => {
                      e.stopPropagation();
                      setMobileActionsReservation(r);
                    }}
                            className="h-9 w-9 inline-flex items-center justify-center rounded-full text-outline hover:text-primary hover:bg-surface-variant transition-colors">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  )}
                </div>
                <div className="space-y-2 ml-[52px]" onClick={(e) => e.stopPropagation()}>
                  {r.eventSchedule?.startTime && (() => {
                    const {date: d, time: tm} = formatToPolishTime(r.eventSchedule!.startTime);
                    return <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>{d}, {tm}</div>;
                  })()}
                  <div onClick={() => openDetailModal(r)}>
                    <ParticipantChips participants={r.participants} onShowAll={() => openDetailModal(r)}/>
                  </div>
                  {r.notes && (
                    <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0">notes</span>
                      <span className="line-clamp-2">{r.notes}</span>
                    </div>
                  )}
                  <PaidBadge r={r} sm/>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {!loading && reservations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <span className="material-symbols-outlined text-[48px] text-outline mb-4">event_busy</span>
            {searchQuery ? (
              <>
                <h4
                  className="font-body-md text-body-md font-semibold text-on-surface">{t('reservations.noResults')}</h4>
                <p
                  className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{t('reservations.noResultsHint', {query: searchQuery})}</p>
                <button type="button" onClick={() => setSearchQuery('')}
                        className="mt-4 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface font-label-bold text-label-bold hover:bg-surface-container-low transition-colors">{t('common.clearSearch')}</button>
              </>
            ) : (
              <>
                <h4
                  className="font-body-md text-body-md font-semibold text-on-surface">{t('reservations.noReservations')}</h4>
                <p
                  className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{t('reservations.noReservationsHint')}</p>
                {!isTrainer() && (
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-label-bold text-label-bold text-on-primary hover:bg-primary-hover transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    {t('reservations.add')}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} totalCount={pagination.totalCount}
                    pageSize={pagination.pageSize} onPageChange={handlePageChange}
                    infoTemplate="Pokazano {start}–{end} z {total}"/>
      </div>

      {/* ══ DESKTOP DROPDOWN ══ */}
      {actionsDropdownOpen && dropdownPosition && (() => {
        const r = reservations.find((x) => x.id === actionsDropdownOpen);
        if (!r) return null;
        return (
          <ModalPortal blockScroll={false}>
            <div className="fixed inset-0 z-[200]" onClick={closeDropdown}>
              <div className="fixed w-52 rounded-xl border border-surface-variant bg-surface-container-lowest shadow-lg"
                   style={{top: dropdownPosition.top, left: dropdownPosition.left}}
                   onClick={(e) => e.stopPropagation()}>
                <button onClick={() => openDetailModal(r)}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors rounded-t-xl">
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  {t('reservations.viewDetails')}
                </button>
                <button onClick={() => handleTogglePaid(r)}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined text-[18px]">{r.isPaid ? 'money_off' : 'payments'}</span>
                  {r.isPaid ? t('reservations.markUnpaid') : t('reservations.markPaid')}
                </button>
                <button onClick={() => handleDelete(r)}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-error hover:bg-error-container transition-colors rounded-b-xl">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  {t('common.delete')}
                </button>
              </div>
            </div>
          </ModalPortal>
        );
      })()}

      {/* ══ MOBILE BOTTOM SHEET ══ */}
      {mobileActionsReservation && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] md:hidden" onClick={() => setMobileActionsReservation(null)}>
            <div className="absolute inset-0 bg-black/50"/>
            <div
              className="absolute bottom-0 left-0 right-0 bg-surface-container-lowest rounded-t-2xl border-t border-surface-variant shadow-lg animate-slide-up"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-outline-variant rounded-full"/>
              </div>
              <div className="px-6 pb-4 flex items-center gap-3 border-b border-surface-variant">
                <div
                  className="h-10 w-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">event</span>
                </div>
                <div>
                  <div
                    className="font-body-md text-body-md text-on-surface font-semibold">{mobileActionsReservation.eventSchedule?.eventType?.name || '—'}</div>
                  <div
                    className="font-body-sm text-body-sm text-on-surface-variant">{mobileActionsReservation.participants?.length || 0} {t('reservations.participants')}</div>
                </div>
              </div>
              <div className="py-2">
                <button onClick={() => openDetailModal(mobileActionsReservation)}
                        className="flex w-full items-center gap-4 px-6 py-3.5 text-on-surface hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined text-[22px]">visibility</span>
                  <span className="font-body-md text-body-md">{t('reservations.viewDetails')}</span>
                </button>
                <button onClick={() => handleTogglePaid(mobileActionsReservation)}
                        className="flex w-full items-center gap-4 px-6 py-3.5 text-on-surface hover:bg-surface-container-low transition-colors">
                  <span
                    className="material-symbols-outlined text-[22px]">{mobileActionsReservation.isPaid ? 'money_off' : 'payments'}</span>
                  <span
                    className="font-body-md text-body-md">{mobileActionsReservation.isPaid ? t('reservations.markUnpaid') : t('reservations.markPaid')}</span>
                </button>
                <button onClick={() => handleDelete(mobileActionsReservation)}
                        className="flex w-full items-center gap-4 px-6 py-3.5 text-error hover:bg-error-container transition-colors">
                  <span className="material-symbols-outlined text-[22px]">delete</span>
                  <span className="font-body-md text-body-md">{t('common.delete')}</span>
                </button>
              </div>
              <div className="px-4 pb-4 pt-2 border-t border-surface-variant">
                <button onClick={() => setMobileActionsReservation(null)}
                        className="w-full py-3 rounded-xl bg-surface-container-low text-on-surface font-label-bold text-label-bold hover:bg-surface-container transition-colors">{t('common.cancel')}</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ══ DETAIL MODAL ══ */}
      {detailReservation && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div
              className="w-full max-w-lg rounded-2xl border border-surface-variant bg-surface-container-lowest p-6 shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-h3 text-h3 text-on-surface">{t('reservations.details')}</h3>
                <button onClick={closeDetailModal} className={closeBtnClass}><span
                  className="material-symbols-outlined">close</span></button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-surface-variant">
                  <div
                    className="h-10 w-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">event</span>
                  </div>
                  <div>
                    <div
                      className="font-body-md text-body-md text-on-surface font-semibold">{detailReservation.eventSchedule?.eventType?.name || '—'}</div>
                    {detailReservation.eventSchedule?.startTime && (() => {
                      const {date, time} = formatToPolishTime(detailReservation.eventSchedule!.startTime);
                      return <div className="font-body-sm text-body-sm text-on-surface-variant">{date}, {time}</div>;
                    })()}
                    {detailReservation.eventSchedule?.eventType?.price != null && (
                      <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        {Number(detailReservation.eventSchedule.eventType.price).toFixed(2)} PLN / os.
                      </div>
                    )}
                  </div>
                </div>

                <div className="pb-4 border-b border-surface-variant">
                  <span
                    className="font-body-md text-body-md text-on-surface font-semibold flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-[18px]">group</span>
                    {t('reservations.participants')} ({detailReservation.participants?.length ?? 0})
                  </span>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {detailReservation.participants?.map((p) => (
                      <div key={p.id} className="rounded-xl bg-surface-container-low px-4 py-3">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="h-8 w-8 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-label-bold text-label-bold text-xs shrink-0">
                            {getInitials(p)}
                          </div>
                          <span className="font-body-md text-body-md text-on-surface font-semibold">{getName(p)}</span>
                        </div>
                        <div className="space-y-1 ml-11">
                          {p.email && (
                            <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                              <span className="material-symbols-outlined text-[16px]">mail</span>
                              {p.email}
                            </div>
                          )}
                          {p.phone && (
                            <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                              <span className="material-symbols-outlined text-[16px]">call</span>
                              {formatPhone(p.phone)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!detailReservation.participants || detailReservation.participants.length === 0) && (
                      <p
                        className="font-body-sm text-body-sm text-on-surface-variant">{t('reservations.noParticipantsInReservation')}</p>
                    )}
                  </div>
                </div>

                <div className="pb-4 border-b border-surface-variant">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-body-md text-body-md text-on-surface font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">notes</span>
                      {t('reservations.notes')}
                    </span>
                    {!isTrainer() && !editingNotes && (
                      <button type="button" onClick={() => {
                        setNotesValue(detailReservation.notes || '');
                        setEditingNotes(true);
                      }}
                              className="flex items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-2 font-label-bold text-label-bold text-on-surface hover:bg-surface-container-low transition-colors text-sm">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        {t('common.edit')}
                      </button>
                    )}
                  </div>
                  {editingNotes ? (
                    <div className="space-y-3">
                      <textarea
                        className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        placeholder={t('reservations.notesPlaceholder')}
                      />
                      <div className="flex gap-3">
                        <button type="button" disabled={savingNotes} onClick={handleSaveNotes}
                                className={`flex-1 bg-primary hover:bg-primary-hover text-on-primary font-label-bold text-label-bold py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 ${savingNotes ? 'opacity-60 cursor-not-allowed' : ''}`}>
                          {savingNotes && <span
                            className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent"/>}
                          {t('common.save')}
                        </button>
                        <button type="button" onClick={() => setEditingNotes(false)}
                                className="px-4 py-2.5 border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface hover:bg-surface-container-low transition-colors">
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="font-body-sm text-body-sm text-on-surface-variant whitespace-pre-wrap">
                      {detailReservation.notes || t('reservations.noNotes')}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span
                      className="font-body-sm text-body-sm text-on-surface-variant">{t('participants.created')}</span>
                    {(() => {
                      const {date, time} = formatToPolishTime(detailReservation.createdAt);
                      return (
                        <div className="mt-0.5">
                          <div className="font-body-sm text-body-sm text-on-surface">{date}</div>
                          <div className="font-body-sm text-body-sm text-on-surface-variant">{time}</div>
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">ID</span>
                    <p className="font-body-sm text-body-sm text-on-surface mt-0.5 truncate"
                       title={detailReservation.id}>{detailReservation.id}</p>
                  </div>
                </div>

                {!isTrainer() && (
                  <div className="pt-2">
                    <button type="button" onClick={() => handleDelete(detailReservation)}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-error text-error font-label-bold text-label-bold hover:bg-error-container transition-colors">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      {t('reservations.deleteReservation')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ══ CREATE RESERVATION MODAL ══ */}
      {showCreateModal && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/50 overflow-y-auto"
            onClick={closeCreateModal}
          >
            {/* Mobile: full width, no margin. Desktop: 80% width capped at 5xl, with vertical margin */}
            <div
              className="w-full md:w-[80%] md:max-w-5xl md:my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {formResourcesLoading ? (
                <div
                  className="min-h-screen md:min-h-0 rounded-none md:rounded-2xl border-0 md:border border-surface-variant bg-surface-container-lowest p-16 flex flex-col items-center justify-center gap-4">
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-outline-variant border-t-primary"/>
                  <span className="font-body-md text-body-md text-on-surface-variant">
                    {t('loading')}
                  </span>
                </div>
              ) : formResourcesError ? (
                <div
                  className="min-h-screen md:min-h-0 rounded-none md:rounded-2xl border-0 md:border border-surface-variant bg-surface-container-lowest p-10 flex flex-col items-center justify-center gap-4 text-center">
                  <span className="material-symbols-outlined text-[40px] text-error">error_outline</span>
                  <div className="font-body-md text-body-md text-on-surface font-semibold">
                    {t('common.errorTitle')}
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
                    {formResourcesError}
                  </p>
                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={fetchFormResources}
                      className="px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-bold text-label-bold hover:bg-primary-hover transition-colors inline-flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">refresh</span>
                      {t('common.retry')}
                    </button>
                    <button
                      type="button"
                      onClick={closeCreateModal}
                      className="px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface font-label-bold text-label-bold hover:bg-surface-container-low transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <ReservationForm
                  editingReservation={null}
                  eventSchedules={formResources.eventSchedules}
                  participants={formResources.participants}
                  eventTypes={formResources.eventTypes}
                  onSubmit={handleCreateReservation}
                  onCancel={closeCreateModal}
                  onAddParticipant={handleAddParticipant}
                />
              )}
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default ReservationList;