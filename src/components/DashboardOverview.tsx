import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../context/I18nContext.tsx';
import { reservationApi, participantApi, eventScheduleApi } from '../services/api.ts';
import { formatToPolishTime } from '../utils/formatDate.ts';

const parseApiResponse = (response: { data?: unknown }): unknown[] => {
  if (!response?.data) return [];
  const d = response.data as unknown;
  if (Array.isArray(d)) return d;
  if (d && typeof d === 'object' && 'items' in d && Array.isArray((d as { items: unknown[] }).items)) {
    return (d as { items: unknown[] }).items;
  }
  if (d && typeof d === 'object' && 'data' in d && Array.isArray((d as { data: unknown[] }).data)) {
    return (d as { data: unknown[] }).data;
  }
  return [];
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const e = error as any;
  return e?.response?.data?.message ?? e?.response?.data ?? e?.message ?? fallback;
};

const DashboardOverview = () => {
  const { t } = useI18n();
  const { selectedCompany } = useAuth();
  const companyId = selectedCompany?.id;

  const [data, setData] = useState<{
    reservations: unknown[];
    participants: unknown[];
    schedules: unknown[];
  }>({
    reservations: [],
    participants: [],
    schedules: [],
  });

  const [loading, setLoading] = useState({
    initial: true,
    refreshing: false,
  });

  const [errors, setErrors] = useState<{
    reservations: string | null;
    participants: string | null;
    schedules: string | null;
  }>({
    reservations: null,
    participants: null,
    schedules: null,
  });

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(
    async (isRefresh = false) => {
      if (!companyId) return;

      try {
        setLoading((prev) => ({
          ...prev,
          [isRefresh ? 'refreshing' : 'initial']: true,
        }));

        setErrors({
          reservations: null,
          participants: null,
          schedules: null,
        });

        const results = await Promise.allSettled([
          reservationApi.getAll(companyId, { pageSize: 500 }),
          participantApi.getAll(companyId, { pageSize: 500 }),
          eventScheduleApi.getAll(companyId, { pageSize: 500 }),
        ]);

        const newData = {
          reservations: [] as unknown[],
          participants: [] as unknown[],
          schedules: [] as unknown[],
        };

        const newErrors = {
          reservations: null as string | null,
          participants: null as string | null,
          schedules: null as string | null,
        };

        if (results[0].status === 'fulfilled') {
          newData.reservations = parseApiResponse(results[0].value);
        } else {
          newErrors.reservations = getErrorMessage(results[0].reason, t('overview.errorHint'));
        }

        if (results[1].status === 'fulfilled') {
          newData.participants = parseApiResponse(results[1].value);
        } else {
          newErrors.participants = getErrorMessage(results[1].reason, t('overview.errorHint'));
        }

        if (results[2].status === 'fulfilled') {
          newData.schedules = parseApiResponse(results[2].value);
        } else {
          newErrors.schedules = getErrorMessage(results[2].reason, t('overview.errorHint'));
        }

        setData(newData);
        setErrors(newErrors);
        setLastUpdated(new Date());
      } catch (_) {
        // noop
      } finally {
        setLoading({
          initial: false,
          refreshing: false,
        });
      }
    },
    [companyId, t]
  );

  useEffect(() => {
    if (companyId) {
      fetchDashboardData();
    } else {
      setLoading({ initial: false, refreshing: false });
    }
  }, [companyId, fetchDashboardData]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const reservations = data.reservations as Array<{
      createdAt?: string;
      status?: string;
      eventSchedule?: { eventType?: { price?: number } };
      eventType?: { price?: number };
      price?: number;
      totalPrice?: number;
      participants?: unknown[];
      participantCount?: number;
    }>;

    const schedules = data.schedules as Array<{
      id?: string;
      startTime?: string;
      status?: string;
      eventType?: { name?: string };
      name?: string;
      placeName?: string;
      location?: string;
    }>;

    const activeReservations = reservations.filter((r) => r.status !== 'Cancelled');

    const currentMonthReservations = activeReservations.filter((r) => {
      if (!r.createdAt) return false;
      const createdAt = new Date(r.createdAt);
      return createdAt >= currentMonthStart && createdAt <= now;
    });

    const previousMonthReservations = activeReservations.filter((r) => {
      if (!r.createdAt) return false;
      const createdAt = new Date(r.createdAt);
      return createdAt >= previousMonthStart && createdAt <= previousMonthEnd;
    });

    const calculateRevenue = (list: typeof reservations) =>
      list.reduce((sum, r) => {
        const totalPrice = Number(r.totalPrice ?? 0);
        if (totalPrice > 0) return sum + totalPrice;

        const unitPrice = Number(
          r.eventSchedule?.eventType?.price ??
          r.eventType?.price ??
          r.price ??
          0
        );
        const count = r.participants?.length ?? r.participantCount ?? 1;
        return sum + unitPrice * count;
      }, 0);

    const currentMonthRevenue = calculateRevenue(currentMonthReservations);
    const previousMonthRevenue = calculateRevenue(previousMonthReservations);

    const upcomingEvents = schedules.filter((s) => {
      if (!s.startTime) return false;
      return new Date(s.startTime) >= now && s.status !== 'Cancelled';
    });

    const upcomingSchedules = [...upcomingEvents]
      .sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime())
      .slice(0, 5);

    return {
      currentMonthReservations: currentMonthReservations.length,
      previousMonthReservations: previousMonthReservations.length,
      currentMonthRevenue,
      previousMonthRevenue,
      totalReservations: activeReservations.length,
      totalParticipants: data.participants.length,
      totalSchedules: schedules.length,
      upcomingEvents: upcomingEvents.length,
      upcomingSchedules,
      nextUpcomingEvent: upcomingSchedules[0] ?? null,
    };
  }, [data]);

  const calculatePercentageChange = (current: number, previous: number) =>
    previous === 0 ? (current > 0 ? 100 : 0) : Number((((current - previous) / previous) * 100).toFixed(1));

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount || 0);

  const getMonthName = (offset = 0) => {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    return d.toLocaleDateString('pl-PL', { month: 'long' });
  };

  const reservationChange = calculatePercentageChange(
    stats.currentMonthReservations,
    stats.previousMonthReservations
  );

  const revenueChange = calculatePercentageChange(
    stats.currentMonthRevenue,
    stats.previousMonthRevenue
  );

  const lastUpdatedFormatted = lastUpdated
    ? formatToPolishTime(lastUpdated.toISOString())
    : null;

  if (!companyId) {
    return (
      <div className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-8">
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <span className="material-symbols-outlined text-[48px] text-outline mb-4">business</span>
          <h2 className="font-h2 text-h2 text-on-surface mb-1">{t('overview.noCompany')}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">{t('overview.noCompanyHint')}</p>
        </div>
      </div>
    );
  }

  if (loading.initial) {
    return (
      <div className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-8">
        <div className="flex items-center justify-center gap-3 text-on-surface-variant">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
          {t('overview.loading')}
        </div>
      </div>
    );
  }

  const hasAllErrors = errors.reservations && errors.participants && errors.schedules;
  if (hasAllErrors) {
    return (
      <div className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-8">
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <span className="material-symbols-outlined text-[48px] text-error mb-4">error</span>
          <h2 className="font-h2 text-h2 text-on-surface mb-1">{t('overview.error')}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-4">{t('overview.errorHint')}</p>
          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            className="bg-secondary hover:bg-secondary-fixed-variant text-on-secondary font-label-bold text-label-bold py-3 px-5 rounded-lg shadow-sm transition-colors"
          >
            {t('common.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  const trendBadge = (change: number) => (
    <div className="flex flex-col items-end gap-0.5">
      <span
        className={`rounded-full px-2.5 py-1 font-label-bold text-label-bold flex items-center gap-1 ${
          change >= 0
            ? 'bg-surface-container-low text-on-surface'
            : 'bg-error-container text-on-error-container'
        }`}
      >
        <span className="material-symbols-outlined text-[14px]">
          {change >= 0 ? 'trending_up' : 'trending_down'}
        </span>
        {change > 0 ? '+' : ''}
        {change}%
      </span>
      <span className="font-body-sm text-body-sm text-outline text-[11px]">
        vs {getMonthName(-1)}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-h2 text-h2 text-on-surface">{t('overview.title')}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            {t('overview.subtitle')}
          </p>
          {lastUpdatedFormatted && (
            <div className="flex items-center gap-2 mt-2 font-body-sm text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              {t('overview.updatedAt')} {lastUpdatedFormatted.date}, {lastUpdatedFormatted.time}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => fetchDashboardData(true)}
          disabled={loading.refreshing}
          className={`flex items-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-2.5 font-label-bold text-label-bold text-on-surface hover:bg-surface-container-low transition-colors self-start sm:self-auto ${
            loading.refreshing ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          <span
            className={`material-symbols-outlined text-[18px] ${loading.refreshing ? 'animate-spin' : ''}`}
          >
            refresh
          </span>
          {t('common.refresh')}
        </button>
      </div>

      {/* Partial errors */}
      {(errors.reservations || errors.participants || errors.schedules) && (
        <div className="space-y-2 rounded-xl border border-error bg-error-container p-4">
          {errors.reservations && (
            <p className="flex items-center gap-2 font-body-sm text-body-sm text-error">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              {t('overview.reservations')}: {errors.reservations}
            </p>
          )}
          {errors.participants && (
            <p className="flex items-center gap-2 font-body-sm text-body-sm text-error">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              {t('participants.title')}: {errors.participants}
            </p>
          )}
          {errors.schedules && (
            <p className="flex items-center gap-2 font-body-sm text-body-sm text-error">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              {t('overview.events')}: {errors.schedules}
            </p>
          )}
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Reservations this month */}
        <div className="rounded-xl border border-surface-variant bg-surface-container-lowest p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="h-10 w-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">event_available</span>
            </div>
            {trendBadge(reservationChange)}
          </div>
          <div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-1">
              {t('overview.reservations')} ({getMonthName()})
            </p>
            <p className="font-h1 text-h1 text-on-surface">
              {stats.currentMonthReservations}
            </p>
          </div>
        </div>

        {/* Participants */}
        <div className="rounded-xl border border-surface-variant bg-surface-container-lowest p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="h-10 w-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">group</span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {t('participants.title')}
            </span>
          </div>
          <div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-1">
              {t('overview.totalParticipants')}
            </p>
            <p className="font-h1 text-h1 text-on-surface">
              {stats.totalParticipants}
            </p>
          </div>
        </div>

        {/* Revenue */}
        <div className="rounded-xl border border-surface-variant bg-surface-container-lowest p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="h-10 w-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
            {trendBadge(revenueChange)}
          </div>
          <div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-1">
              {t('overview.revenue')} ({getMonthName()})
            </p>
            <p className="font-h1 text-h1 text-on-surface">
              {formatAmount(stats.currentMonthRevenue)} PLN
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming schedules */}
        <div className="lg:col-span-2 w-full bg-surface-container-lowest rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-surface-variant overflow-hidden">
          <div className="p-4 md:p-6 border-b border-surface-variant flex items-center justify-between gap-4 bg-surface-bright">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">schedule</span>
              <h2 className="font-h3 text-h3 text-on-surface">{t('overview.upcoming')}</h2>
            </div>
            <span className="rounded-full bg-surface-container-low px-3 py-1 font-body-sm text-body-sm text-on-surface-variant">
              {stats.upcomingSchedules.length}
            </span>
          </div>

          <div className="p-4 md:p-6">
            {stats.upcomingSchedules.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingSchedules.map((s, idx) => {
                  const { date, time } = formatToPolishTime(s.startTime);
                  return (
                    <div
                      key={s.id ?? idx}
                      className="rounded-xl border border-surface-variant bg-surface-container-low p-4 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">event</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="font-body-md text-body-md font-semibold text-on-surface truncate">
                                {s.eventType?.name ?? s.name ?? t('overview.event')}
                              </h4>
                              <p className="mt-1 flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                                <span className="material-symbols-outlined text-[16px]">location_on</span>
                                <span className="truncate">
                                  {s.placeName ?? s.location ?? t('overview.noLocation')}
                                </span>
                              </p>
                            </div>
                            <div className="shrink-0 text-left sm:text-right">
                              <div className="font-body-sm text-body-sm text-on-surface">{date}</div>
                              <div className="font-body-sm text-body-sm text-on-surface-variant">{time}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="material-symbols-outlined text-[40px] text-outline mb-3">event_busy</span>
                <h4 className="font-body-md text-body-md font-semibold text-on-surface">
                  {t('overview.noUpcoming')}
                </h4>
              </div>
            )}
          </div>
        </div>

        {/* Summary + Help Center */}
        <div className="flex flex-col gap-4">
          {/* Summary */}
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-surface-variant overflow-hidden">
            <div className="p-4 md:p-6 border-b border-surface-variant flex items-center gap-2 bg-surface-bright">
              <span className="material-symbols-outlined text-[20px] text-primary">analytics</span>
              <h2 className="font-h3 text-h3 text-on-surface">{t('overview.summary')}</h2>
            </div>

            <div className="p-4 md:p-6 space-y-3">
              <div className="rounded-xl border border-surface-variant bg-surface-container-low p-4">
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {t('overview.totalReservations')}
                </p>
                <p className="mt-1 font-h3 text-h3 text-on-surface">{stats.totalReservations}</p>
              </div>

              <div className="rounded-xl border border-surface-variant bg-surface-container-low p-4">
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {t('overview.totalSchedules')}
                </p>
                <p className="mt-1 font-h3 text-h3 text-on-surface">{stats.totalSchedules}</p>
              </div>

              <div className="rounded-xl border border-surface-variant bg-surface-container-low p-4">
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {t('overview.nextEvent')}
                </p>
                {stats.nextUpcomingEvent?.startTime ? (
                  (() => {
                    const { date, time } = formatToPolishTime(stats.nextUpcomingEvent.startTime);
                    return (
                      <div className="mt-1">
                        <p className="font-body-md text-body-md font-semibold text-on-surface">
                          {stats.nextUpcomingEvent.eventType?.name ??
                            stats.nextUpcomingEvent.name ??
                            t('overview.event')}
                        </p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{date}</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{time}</p>
                      </div>
                    );
                  })()
                ) : (
                  <p className="mt-1 font-body-md text-body-md text-on-surface">
                    {t('overview.noUpcoming')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Help Center */}
          <div className="rounded-xl bg-primary text-on-primary p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-on-primary/5 rounded-full blur-xl" />
            <h3 className="font-h3 text-h3 mb-2">{t('overview.helpCenter')}</h3>
            <p className="font-body-sm text-body-sm mb-4 opacity-80">
              {t('overview.helpCenterHint')}
            </p>
            <button className="bg-on-primary text-primary font-label-bold text-label-bold px-4 py-2.5 rounded-lg shadow-sm w-full hover:opacity-90 transition-opacity">
              {t('overview.helpCenter')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;