import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { eventTypeApi, staffMemberApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CalendarHeader from '../EventCalendar/components/CalendarHeader/CalendarHeader';
import CalendarGrid from '../EventCalendar/components/CalendarGrid/CalendarGrid';
import EventModal from '../EventCalendar/components/EventModal/EventModal';
import ErrorModal from '../common/ErrorModal/ErrorModal';

const TrainerClassesCalendar: React.FC = () => {
  const { selectedCompany, staffMember, isTrainer } = useAuth();
  const companyId = selectedCompany?.id;
  const staffMemberId = staffMember?.id;
  const [searchParams, setSearchParams] = useSearchParams();

  const monthParam = searchParams.get('month');
  const eventTypeParam = searchParams.get('eventType') || '';
  const editParam = searchParams.get('edit');
  const dayParam = searchParams.get('day');

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
  const [classes, setClasses] = useState<any[]>([]);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    if (editParam && classes.length > 0) {
      const event = classes.find((s) => s.id === editParam);
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
  }, [editParam, dayParam, classes]);

  const fetchEventTypes = useCallback(async () => {
    if (!companyId) return;
    try {
      const response = await eventTypeApi.getAll(companyId);
      setEventTypes((response.data as any)?.items || []);
    } catch (err) {
      console.error('Error fetching event types:', err);
    }
  }, [companyId]);

  const fetchTrainerClasses = useCallback(async () => {
    if (!companyId || !staffMemberId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await staffMemberApi.getEventSchedules(companyId, staffMemberId);
      const data = response.data as any;
      setClasses(data || []);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [companyId, staffMemberId]);

  useEffect(() => {
    fetchEventTypes();
  }, [fetchEventTypes]);

  useEffect(() => {
    fetchTrainerClasses();
  }, [fetchTrainerClasses]);

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

    classes.forEach((cls) => {
      if (!cls.startTime) return;

      const dateKey = formatDateKey(new Date(cls.startTime));

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(cls);
    });

    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    });

    return grouped;
  }, [classes]);

  const eventDates = useMemo(() => Object.keys(eventsByDate), [eventsByDate]);

  const eventsInCurrentMonth = useMemo(() => {
    const currentMonthKey = formatMonthKey(currentDate);
    return eventDates
      .filter((date) => date.startsWith(currentMonthKey))
      .reduce((sum, date) => sum + (eventsByDate[date]?.length || 0), 0);
  }, [currentDate, eventDates, eventsByDate]);

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    updateMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    updateMonth(newDate);
  };

  const goToToday = () => {
    updateMonth(new Date());
  };

  const handleDayClick = (date: Date) => {
    if (isTrainer()) {
      setSelectedDate(date);
      setSelectedEvent(null);
      setModalOpen(true);
      return;
    }

    openAddModal(date);
  };

  const handleEventClick = (event: any, e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (isTrainer()) {
      setSelectedEvent(event);
      setSelectedDate(new Date(event.startTime));
      setModalOpen(true);
      return;
    }

    openEditModal(event);
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
        await staffMemberApi.update(companyId!, selectedEvent.id, requestData as Record<string, unknown>);
      } else {
        await staffMemberApi.create(companyId!, requestData as Record<string, unknown>);
      }

      await fetchTrainerClasses();
      closeModal();
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      await staffMemberApi.removeFromEventSchedule(companyId!, eventId);
      await fetchTrainerClasses();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const getEventsForSelectedDate = () => {
    if (!selectedDate) return [];
    const dateKey = formatDateKey(selectedDate);
    return eventsByDate[dateKey] || [];
  };

  const clearError = () => setError(null);

  if (loading && classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 gap-4 text-zinc-500 dark:text-zinc-400">
        <div className="w-10 h-10 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin" />
        <p>Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-700 overflow-hidden">
      <ErrorModal error={error} onClose={clearError} title="Calendar Error" />

      <CalendarHeader
        currentDate={currentDate}
        onPrevMonth={goToPreviousMonth}
        onNextMonth={goToNextMonth}
        onToday={goToToday}
        eventsCount={eventsInCurrentMonth}
        totalEvents={classes.length}
        eventTypes={eventTypes}
        selectedEventTypeId={eventTypeParam}
        onEventTypeFilter={handleEventTypeFilter}
        loading={loading}
      />

      <CalendarGrid
        currentDate={currentDate}
        eventsByDate={eventsByDate}
        onDayClick={handleDayClick}
        onEventClick={handleEventClick}
      />

      {modalOpen && companyId && (
        <EventModal
          isOpen={modalOpen}
          onClose={closeModal}
          companyId={companyId}
          selectedDate={selectedDate}
          selectedEvent={selectedEvent}
          eventTypes={eventTypes}
          eventsForDay={getEventsForSelectedDate()}
          readOnly
        />
      )}
    </div>
  );
};

export default TrainerClassesCalendar;
