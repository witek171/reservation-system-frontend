import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { eventScheduleApi, eventTypeApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import CalendarHeader from './components/CalendarHeader.tsx';
import CalendarGrid from './components/CalendarGrid.tsx';
import TimeGridView from './components/TimeGridView.tsx';
import EventModal from './components/EventModal.tsx';
import DaySidebar from './components/DaySidebar.tsx';
import ErrorModal from '../common/ErrorModal.tsx';

const toKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const toMonthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const EventCalendar: React.FC = () => {
  const { t } = useI18n();
  const { selectedCompany } = useAuth();
  const companyId = selectedCompany?.id;
  const [searchParams, setSearchParams] = useSearchParams();

  const monthParam = searchParams.get('month');
  const eventTypeParam = searchParams.get('eventType') || '';
  const editParam = searchParams.get('edit');
  const dayParam = searchParams.get('day');
  const viewModeParam = (searchParams.get('view') as 'month' | 'week' | null) || 'month';

  const getInitialDate = useCallback(() => {
    if (monthParam) {
      const [y, m] = monthParam.split('-').map(Number);
      if (y && m >= 1 && m <= 12) return new Date(y, m - 1, 1);
    }
    return new Date();
  }, [monthParam]);

  const [currentDate, setCurrentDate] = useState(getInitialDate);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>(viewModeParam);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [sidebarDate, setSidebarDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!monthParam) return;
    const [y, m] = monthParam.split('-').map(Number);
    if (y && m >= 1 && m <= 12) {
      const nd = new Date(y, m - 1, 1);
      if (toMonthKey(nd) !== toMonthKey(currentDate)) setCurrentDate(nd);
    }
  }, [monthParam]);

  const updateMonth = useCallback((nd: Date) => {
    setCurrentDate(nd);
    setSearchParams((p) => { const np = new URLSearchParams(p); np.set('month', toMonthKey(nd)); return np; }, { replace: true });
  }, [setSearchParams]);

  const handleViewModeChange = useCallback((mode: 'month' | 'week') => {
    setViewMode(mode);
    setSearchParams((p) => { const np = new URLSearchParams(p); np.set('view', mode); return np; }, { replace: true });
  }, [setSearchParams]);

  const handleEventTypeFilter = useCallback((id: string) => {
    setSearchParams((p) => { const np = new URLSearchParams(p); id ? np.set('eventType', id) : np.delete('eventType'); return np; }, { replace: true });
  }, [setSearchParams]);

  const openEditModal = useCallback((event: any) => {
    setSelectedEvent(event); setSelectedDate(new Date(event.startTime)); setModalOpen(true);
    setSearchParams((p) => { const np = new URLSearchParams(p); np.set('edit', event.id); np.delete('day'); return np; }, { replace: true });
  }, [setSearchParams]);

  const openAddModal = useCallback((date: Date) => {
    setSelectedDate(date); setSelectedEvent(null); setModalOpen(true);
    setSearchParams((p) => { const np = new URLSearchParams(p); np.set('day', toKey(date)); np.delete('edit'); return np; }, { replace: true });
  }, [setSearchParams]);

  const closeModal = useCallback(() => {
    setModalOpen(false); setSelectedEvent(null); setSelectedDate(null);
    setSearchParams((p) => { const np = new URLSearchParams(p); np.delete('edit'); np.delete('day'); return np; }, { replace: true });
  }, [setSearchParams]);

  const handleDayClick = useCallback((date: Date) => { setSidebarDate(date); }, []);
  const handleEventClick = useCallback((event: any, e?: React.MouseEvent) => {
    e?.stopPropagation();

    // Tworzymy znormalizowany obiekt dla formularza edycji
    const eventForModal = {
      ...event,
      // Jeśli formularz oczekuje eventTypeId, wyciągamy je z zagnieżdżonego obiektu
      eventTypeId: event.eventTypeId || event.eventType?.id
    };

    openEditModal(eventForModal);
  }, [openEditModal]);
  const handleMonthLabelClick = useCallback(() => { setSidebarDate(new Date()); }, []);

  useEffect(() => {
    if (editParam && schedules.length > 0) {
      const ev = schedules.find((s) => s.id === editParam);
      if (ev) { setSelectedEvent(ev); setSelectedDate(new Date(ev.startTime)); setModalOpen(true); }
    } else if (dayParam && !editParam) {
      const [y, m, d] = dayParam.split('-').map(Number);
      if (y && m && d) { setSelectedDate(new Date(y, m - 1, d)); setSelectedEvent(null); setModalOpen(true); }
    } else if (!editParam && !dayParam && modalOpen) {
      setModalOpen(false); setSelectedEvent(null); setSelectedDate(null);
    }
  }, [editParam, dayParam, schedules]);

  const fetchEventTypes = useCallback(async () => {
    if (!companyId) return;
    try { const res = await eventTypeApi.getAll(companyId); setEventTypes((res.data as any)?.items || []); } catch (_) {}
  }, [companyId]);

  const fetchSchedules = useCallback(async () => {
    if (!companyId) return;
    try {
      setLoading(true); setError(null);
      const params: any = { page: 0, pageSize: 400 };
      if (eventTypeParam) params.eventTypeId = eventTypeParam;
      const res = await eventScheduleApi.getAll(companyId, params);
      setSchedules((res.data as any)?.items || []);
    } catch (err: any) { setError(err.response?.data?.message || err.message); } finally { setLoading(false); }
  }, [companyId, eventTypeParam]);

  useEffect(() => { fetchEventTypes(); }, [fetchEventTypes]);
  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);
  useEffect(() => { if (!monthParam) setSearchParams((p) => { const np = new URLSearchParams(p); np.set('month', toMonthKey(new Date())); return np; }, { replace: true }); }, []);

  const eventsByDate = useMemo(() => {
    const g: Record<string, any[]> = {};
    schedules.forEach((s) => { if (!s.startTime) return; const k = toKey(new Date(s.startTime)); if (!g[k]) g[k] = []; g[k].push(s); });
    Object.keys(g).forEach((k) => { g[k].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()); });
    return g;
  }, [schedules]);

  const eventDates = useMemo(() => Object.keys(eventsByDate), [eventsByDate]);
  const eventsInCurrentMonth = useMemo(() => {
    const mk = toMonthKey(currentDate);
    return eventDates.filter((d) => d.startsWith(mk)).reduce((s, d) => s + (eventsByDate[d]?.length || 0), 0);
  }, [currentDate, eventDates, eventsByDate]);

  const sidebarEvents = useMemo(() => sidebarDate ? eventsByDate[toKey(sidebarDate)] || [] : [], [sidebarDate, eventsByDate]);

  const goToPrev = () => {
    if (viewMode === 'week') { const d = new Date(currentDate); d.setDate(d.getDate() - 7); updateMonth(d); }
    else updateMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const goToNext = () => {
    if (viewMode === 'week') { const d = new Date(currentDate); d.setDate(d.getDate() + 7); updateMonth(d); }
    else updateMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleSaveEvent = async (formData: { eventTypeId: string; placeName: string; startTime: Date | string }) => {
    try {
      setError(null);
      const startTime = formData.startTime instanceof Date ? formData.startTime.toISOString() : new Date(formData.startTime).toISOString();
      const req = { eventTypeId: formData.eventTypeId, placeName: formData.placeName, startTime };
      if (selectedEvent) await eventScheduleApi.update(companyId!, selectedEvent.id, req);
      else await eventScheduleApi.create(companyId!, req);
      await fetchSchedules(); closeModal();
    } catch (err) { throw err; }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm(t('schedule.deleteConfirm'))) return;
    try { await eventScheduleApi.delete(companyId!, eventId); await fetchSchedules(); closeModal(); }
    catch (err: any) { setError(err.response?.data?.message || err.message); }
  };

  if (loading && schedules.length === 0) {
    return (
      <div className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-8">
        <div className="flex items-center justify-center gap-3 text-on-surface-variant">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
          {t('schedule.loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <ErrorModal error={error} onClose={() => setError(null)} />}

      {/* Layout: calendar + sidebar */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
        {/* Calendar — nie rozciąga się */}
        <div className="flex-1 min-w-0 bg-surface-container-lowest rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-surface-variant overflow-hidden self-start">
          <CalendarHeader
            currentDate={currentDate}
            onPrevMonth={goToPrev}
            onNextMonth={goToNext}
            onToday={() => updateMonth(new Date())}
            eventsCount={eventsInCurrentMonth}
            totalEvents={schedules.length}
            eventTypes={eventTypes}
            selectedEventTypeId={eventTypeParam}
            onEventTypeFilter={handleEventTypeFilter}
            loading={loading}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onMonthLabelClick={handleMonthLabelClick}
          />
          <div className="overflow-auto">
            {viewMode === 'week' ? (
              <TimeGridView currentDate={currentDate} eventsByDate={eventsByDate} onDayClick={handleDayClick} onEventClick={handleEventClick} />
            ) : (
              <CalendarGrid currentDate={currentDate} eventsByDate={eventsByDate} onDayClick={handleDayClick} onEventClick={handleEventClick} />
            )}
          </div>
        </div>

        {/* Desktop sidebar — rośnie w dół niezależnie */}
        <div className="hidden lg:block w-80 shrink-0">
          <DaySidebar date={sidebarDate} events={sidebarEvents} onEventClick={openEditModal} onAddEvent={openAddModal} onClose={() => setSidebarDate(null)} />
        </div>
      </div>

      {/* Mobile bottom sheet */}
      {sidebarDate && (
        <div className="lg:hidden">
          <DaySidebar date={sidebarDate} events={sidebarEvents} onEventClick={openEditModal} onAddEvent={openAddModal} onClose={() => setSidebarDate(null)} mobile />
        </div>
      )}

      {modalOpen && (
        <EventModal
          isOpen={modalOpen} onClose={closeModal} companyId={companyId ?? ''} selectedDate={selectedDate} selectedEvent={selectedEvent}
          eventTypes={eventTypes} eventsForDay={selectedDate ? eventsByDate[toKey(selectedDate)] || [] : []}
          onSave={handleSaveEvent} onDelete={handleDeleteEvent} onEditEvent={openEditModal}
        />
      )}
    </div>
  );
};

export default EventCalendar;