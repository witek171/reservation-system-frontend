import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { staffMemberApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import AvailabilityHeader from './components/AvailabilityHeader/AvailabvilityHeader';
import AvailabilityWeekGrid from './components/AvailabilityWeekGrid/AvailabilityWeekGrid';
import AvailabilityModal from './components/AvailabilityModal/AvailabilityModal';
import ErrorModal from '../common/ErrorModal/ErrorModal';

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const AvailabilityCalendar: React.FC = () => {
  const { selectedCompany, staffMember, isTrainer } = useAuth();
  const companyId = selectedCompany?.id;
  const staffMemberId = staffMember?.id;
  const [searchParams, setSearchParams] = useSearchParams();

  const weekParam = searchParams.get('week');
  const editParam = searchParams.get('edit');
  const dayParam = searchParams.get('day');

  const getInitialWeekStart = useCallback(() => {
    if (weekParam) {
      const [y, m, d] = weekParam.split('-').map(Number);
      if (y && m && d) {
        const date = new Date(y, m - 1, d);
        return getMonday(date);
      }
    }
    return getMonday(new Date());
  }, [weekParam]);

  const [weekStart, setWeekStart] = useState(getInitialWeekStart);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [classesForTrainer, setClassesForTrainer] = useState<any[]>([]);
  const [, setStaffMemberData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAvailability, setSelectedAvailability] = useState<any>(null);

  useEffect(() => {
    if (weekParam) {
      const [y, m, d] = weekParam.split('-').map(Number);
      if (y && m && d) {
        const date = new Date(y, m - 1, d);
        const monday = getMonday(date);
        if (formatDateKey(monday) !== formatDateKey(weekStart)) {
          setWeekStart(monday);
        }
      }
    }
  }, [weekParam]);

  const updateWeek = useCallback(
    (newWeekStart: Date) => {
      const monday = getMonday(newWeekStart);
      setWeekStart(monday);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set('week', formatDateKey(monday));
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const openEditModal = useCallback(
    (availability: any) => {
      setSelectedAvailability(availability);
      setSelectedDate(new Date(availability.startTime));
      setModalOpen(true);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set('edit', availability.id);
          params.delete('day');
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const openAddModal = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      setSelectedAvailability(null);
      setModalOpen(true);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set('day', formatDateKey(date));
          params.delete('edit');
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedAvailability(null);
    setSelectedDate(null);
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.delete('edit');
        params.delete('day');
        return params;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  useEffect(() => {
    if (editParam && availabilities.length > 0) {
      const slot = availabilities.find((a) => a.id === editParam);
      if (slot) {
        setSelectedAvailability(slot);
        setSelectedDate(new Date(slot.startTime));
        setModalOpen(true);
      }
    } else if (dayParam && !editParam) {
      const [year, month, day] = dayParam.split('-').map(Number);
      if (year && month && day) {
        setSelectedDate(new Date(year, month - 1, day));
        setSelectedAvailability(null);
        setModalOpen(true);
      }
    } else if (!editParam && !dayParam) {
      if (modalOpen) {
        setModalOpen(false);
        setSelectedAvailability(null);
        setSelectedDate(null);
      }
    }
  }, [editParam, dayParam, availabilities]);

  const fetchAvailabilities = useCallback(async () => {
    if (!companyId || !staffMemberId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await staffMemberApi.getAvailability(companyId, staffMemberId);
      const data = response.data as unknown;
      // API returns array of StaffMemberAvailabilityResponse (each has id, date, startTime, endTime)
      const list = Array.isArray(data) ? data : (data as { availableSlots?: unknown[] })?.availableSlots ?? [];
      setStaffMemberData(typeof data === 'object' && data !== null && 'staffMember' in data ? (data as { staffMember: unknown }).staffMember : null);
      setAvailabilities(list);
    } catch (err: any) {
      console.error('Error fetching availability:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [companyId, staffMemberId]);

  const fetchClasses = useCallback(async () => {
    if (!companyId || !staffMemberId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await staffMemberApi.getEventSchedules(companyId, staffMemberId);
      const data = response.data as any;
      setClassesForTrainer(data || []);
    } catch (err: any) {
      console.error('Error fetching classes:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [companyId, staffMemberId]);

  useEffect(() => {
    fetchAvailabilities();
  }, [fetchAvailabilities]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (!weekParam) {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set('week', formatDateKey(getMonday(new Date())));
          return params;
        },
        { replace: true }
      );
    }
  }, []);

  const availabilitiesByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    availabilities.forEach((slot) => {
      if (!slot.startTime) return;
      const dateKey = formatDateKey(new Date(slot.startTime));
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(slot);
    });
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    });
    return grouped;
  }, [availabilities]);

  const classesByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    classesForTrainer.forEach((classItem) => {
      if (!classItem.startTime) return;
      const dateKey = formatDateKey(new Date(classItem.startTime));
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(classItem);
    });
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    });
    return grouped;
  }, [classesForTrainer]);

  const weekDateKeys = useMemo(() => {
    const keys: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      keys.push(formatDateKey(d));
    }
    return keys;
  }, [weekStart]);

  const availabilitiesInCurrentWeek = useMemo(() => {
    return weekDateKeys.reduce((sum, key) => sum + (availabilitiesByDate[key]?.length || 0), 0);
  }, [weekDateKeys, availabilitiesByDate]);

  const goToPreviousWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(weekStart.getDate() - 7);
    updateWeek(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(weekStart.getDate() + 7);
    updateWeek(newDate);
  };

  const goToThisWeek = () => {
    updateWeek(new Date());
  };

  const handleSlotClick = (date: Date, _hour: number) => {
    if (isTrainer()) {
      setSelectedDate(date);
      setSelectedAvailability(null);
      setModalOpen(true);
      return;
    }
    openAddModal(date);
  };

  const handleAvailabilityClick = (availability: any, e: React.MouseEvent) => {
    e?.stopPropagation();
    if (isTrainer()) {
      setSelectedAvailability(availability);
      setSelectedDate(new Date(availability.startTime));
      setModalOpen(true);
      return;
    }
    openEditModal(availability);
  };

  const getSlotsForSelectedDate = () => {
    if (!selectedDate) return [];
    return availabilitiesByDate[formatDateKey(selectedDate)] || [];
  };

  const getClassesForSelectedDate = () => {
    if (!selectedDate) return [];
    return classesByDate[formatDateKey(selectedDate)] || [];
  };

  const handleSaveAvailability = async (formData: {
    date: string;
    startTime: string;
    endTime: string;
  }) => {
    try {
      setError(null);
      await staffMemberApi.addAvailability(companyId!, staffMemberId!, formData);
      await fetchAvailabilities();
      closeModal();
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteAvailability = async (availabilityId: string) => {
    await staffMemberApi.removeAvailability(companyId!, availabilityId);
    await fetchAvailabilities();
    closeModal();
  };

  const clearError = () => setError(null);

  if (loading && availabilities.length === 0 && classesForTrainer.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 gap-4 text-zinc-500 dark:text-zinc-400">
        <div className="w-10 h-10 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin" />
        <p>Loading availability...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-700 overflow-hidden">
      <ErrorModal error={error} onClose={clearError} title="Availability Error" />

      <AvailabilityHeader
        weekStart={weekStart}
        onPrevWeek={goToPreviousWeek}
        onNextWeek={goToNextWeek}
        onToday={goToThisWeek}
        availabilitiesInWeek={availabilitiesInCurrentWeek}
        totalAvailabilities={availabilities.length}
      />

      <AvailabilityWeekGrid
        weekStart={weekStart}
        availabilitiesByDate={availabilitiesByDate}
        classesByDate={classesByDate}
        onSlotClick={handleSlotClick}
        onAvailabilityClick={handleAvailabilityClick}
      />

      {modalOpen && (
        <AvailabilityModal
          isOpen={modalOpen}
          onClose={closeModal}
          selectedDate={selectedDate}
          selectedAvailability={selectedAvailability}
          slotsForDay={getSlotsForSelectedDate()}
          classesForDay={getClassesForSelectedDate()}
          onSave={handleSaveAvailability}
          onDelete={handleDeleteAvailability}
        />
      )}
    </div>
  );
};

export default AvailabilityCalendar;
