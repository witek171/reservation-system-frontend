import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { eventScheduleApi, eventTypeApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import CalendarHeader from './components/CalendarHeader.tsx';
import CalendarGrid from './components/CalendarGrid.tsx';
import TimeGridView from './components/TimeGridView.tsx';
import EventModal from './components/EventModal.tsx';
import ErrorModal from '../common/ErrorModal.tsx';

const toLocalDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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
      const [year, month] = monthParam.split('-').map(Number);
      if (year && month && month >= 1 && month <= 12) {
        return new Date(year, month - 1, 1);
      }
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

  const formatMonthKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (monthParam) {
      const [year, month] = monthParam.split('-').map(Number);
      if (year && month && month >= 1 && month <= 12) {
        const newDate = new Date(year, month - 1, 1);
        if (formatMonthKey(newDate) !== formatMonthKey(currentDate)) {
          setCurrentDate(newDate);
        }
      }
    }
  }, [monthParam]);

  const updateMonth = useCallback(
    (newDate: Date) => {
      setCurrentDate(newDate);
      const newMonthKey = formatMonthKey(newDate);

      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set('month', newMonthKey);
        return params;
      }, { replace: true });
    },
    [setSearchParams]
  );

  const handleViewModeChange = useCallback(
    (mode: 'month' | 'week') => {
      setViewMode(mode);
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set('view', mode);
        return params;
      }, { replace: true });
    },
    [setSearchParams]
  );

  const handleEventTypeFilter = useCallback(
    (eventTypeId: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (eventTypeId) {
          params.set('eventType', eventTypeId);
        } else {
          params.delete('eventType');
        }
        return params;
      }, { replace: true });
    },
    [setSearchParams]
  );

  const openEditModal = useCallback(
    (event: any) => {
      setSelectedEvent(event);
      setSelectedDate(new Date(event.startTime));
      setModalOpen(true);

      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set('edit', event.id);
        params.delete('day');
        return params;
      }, { replace: true });
    },
    [setSearchParams]
  );

  const openAddModal = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      setSelectedEvent(null);
      setModalOpen(true);

      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set('day', formatDateKey(date));
        params.delete('edit');
        return params;
      }, { replace: true });
    },
    [setSearchParams]
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedEvent(null);
    setSelectedDate(null);

    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.delete('edit');
      params.delete('day');
      return params;
    }, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    if (editParam && schedules.length > 0) {
      const event = schedules.find((s) => s.id === editParam);
      if (event) {
        setSelectedEvent(event);
        setSelectedDate(new Date(event.startTime));
        setModalOpen(true);
      }
    } else if (dayParam && !editParam) {
      const [year, month, day] = dayParam.split('-').map(Number);
      if (year && month && day) {
        setSelectedDate(new Date(year, month - 1, day));
        setSelectedEvent(null);
        setModalOpen(true);
      }
    } else if (!editParam && !dayParam) {
      if (modalOpen) {
        setModalOpen(false);
        setSelectedEvent(null);
        setSelectedDate(null);
      }
    }
  }, [editParam, dayParam, schedules]);

  const fetchEventTypes = useCallback(async () => {
    if (!companyId) return;
    try {
      const response = await eventTypeApi.getAll(companyId);
      setEventTypes((response.data as any)?.items || []);
    } catch (err) {
      console.error('Error fetching event types:', err);
    }
  }, [companyId]);

  const fetchSchedules = useCallback(async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: 0,
        pageSize: 400,
      };

      if (eventTypeParam) {
        params.eventTypeId = eventTypeParam;
      }

      const response = await eventScheduleApi.getAll(companyId, params);
      setSchedules((response.data as any)?.items || []);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [companyId, eventTypeParam]);

  useEffect(() => {
    fetchEventTypes();
  }, [fetchEventTypes]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    if (!monthParam) {
      const currentMonthKey = formatMonthKey(new Date());
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set('month', currentMonthKey);
        return params;
      }, { replace: true });
    }
  }, []);

  const eventsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};

    schedules.forEach((schedule) => {
      if (!schedule.startTime) return;
      const date = new Date(schedule.startTime);
      const dateKey = toLocalDateKey(date);

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(schedule);
    });

    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    });

    return grouped;
  }, [schedules]);

  const eventDates = useMemo(() => Object.keys(eventsByDate), [eventsByDate]);

  const eventsInCurrentMonth = useMemo(() => {
    const currentMonthKey = formatMonthKey(currentDate);
    return eventDates
      .filter((date) => date.startsWith(currentMonthKey))
      .reduce((sum, date) => sum + (eventsByDate[date]?.length || 0), 0);
  }, [currentDate, eventDates, eventsByDate]);

  const goToPreviousMonth = () => {
    if (viewMode === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      updateMonth(newDate);
    } else {
      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      updateMonth(newDate);
    }
  };

  const goToNextMonth = () => {
    if (viewMode === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      updateMonth(newDate);
    } else {
      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      updateMonth(newDate);
    }
  };

  const goToToday = () => {
    updateMonth(new Date());
  };

  const handleDayClick = (date: Date) => {
    openAddModal(date);
  };

  const handleEventClick = (event: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    openAddModal(new Date(event.startTime));
  };

  const handleEditEvent = (event: any) => {
    openEditModal(event);
  };

  const handleSaveEvent = async (formData: {
    eventTypeId: string;
    placeName: string;
    startTime: Date | string;
  }) => {
    try {
      setError(null);

      const startTime =
        formData.startTime instanceof Date
          ? formData.startTime.toISOString()
          : new Date(formData.startTime).toISOString();

      const requestData = {
        eventTypeId: formData.eventTypeId,
        placeName: formData.placeName,
        startTime,
      };

      if (selectedEvent) {
        await eventScheduleApi.update(companyId!, selectedEvent.id, requestData);
      } else {
        await eventScheduleApi.create(companyId!, requestData);
      }

      await fetchSchedules();
      closeModal();
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm(t('schedule.deleteConfirm'))) return;

    try {
      await eventScheduleApi.delete(companyId!, eventId);
      await fetchSchedules();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const getEventsForSelectedDate = () => {
    if (!selectedDate) return [];
    const dateKey = toLocalDateKey(selectedDate);
    return eventsByDate[dateKey] || [];
  };

  const clearError = () => setError(null);

  if (loading && schedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 gap-4 text-zinc-500 dark:text-zinc-400">
        <div className="w-10 h-10 border-2 border-zinc-200 border-t-primary-500 dark:border-t-primary-400 rounded-full animate-spin" />
        <p>{t('schedule.loading')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden flex flex-col">
      <ErrorModal error={error} onClose={clearError} title={t('schedule.errorTitle')} />

      <CalendarHeader
        currentDate={currentDate}
        onPrevMonth={goToPreviousMonth}
        onNextMonth={goToNextMonth}
        onToday={goToToday}
        eventsCount={eventsInCurrentMonth}
        totalEvents={schedules.length}
        eventTypes={eventTypes}
        selectedEventTypeId={eventTypeParam}
        onEventTypeFilter={handleEventTypeFilter}
        loading={loading}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      <div className="flex-1 overflow-auto">
        {viewMode === 'week' ? (
          <TimeGridView
            currentDate={currentDate}
            eventsByDate={eventsByDate}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        ) : (
          <CalendarGrid
            currentDate={currentDate}
            eventsByDate={eventsByDate}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      {modalOpen && (
        <EventModal
          isOpen={modalOpen}
          onClose={closeModal}
          companyId={companyId ?? ''}
          selectedDate={selectedDate}
          selectedEvent={selectedEvent}
          eventTypes={eventTypes}
          eventsForDay={getEventsForSelectedDate()}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          onEditEvent={handleEditEvent}
        />
      )}
    </div>
  );
};

export default EventCalendar;
