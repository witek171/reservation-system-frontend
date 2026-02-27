import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../context/I18nContext.tsx';
import { reservationApi, participantApi, eventScheduleApi } from '../services/api.ts';
import { IconCalendar, IconUsers, IconClock, IconAlert, IconRefresh, IconBuilding, IconCurrency } from './common/Icons.tsx';

const parseApiResponse = (response: { data?: unknown }): unknown[] => {
  if (!response?.data) return [];
  const d = response.data as unknown;
  if (Array.isArray(d)) return d;
  if (d && typeof d === 'object' && 'items' in d && Array.isArray((d as { items: unknown[] }).items))
    return (d as { items: unknown[] }).items;
  if (d && typeof d === 'object' && 'data' in d && Array.isArray((d as { data: unknown[] }).data))
    return (d as { data: unknown[] }).data;
  return [];
};

const DashboardOverview = () => {
  const { t, locale } = useI18n();
  const { selectedCompany } = useAuth();
  const companyId = selectedCompany?.id;
  const [data, setData] = useState<{ reservations: unknown[]; participants: unknown[]; schedules: unknown[] }>({
    reservations: [],
    participants: [],
    schedules: [],
  });
  const [loading, setLoading] = useState({ initial: true, refreshing: false });
  const [errors, setErrors] = useState<{ reservations: string | null; participants: string | null; schedules: string | null }>({
    reservations: null,
    participants: null,
    schedules: null,
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(
    async (isRefresh = false) => {
      if (!companyId) return;
      try {
        setLoading((prev) => ({ ...prev, [isRefresh ? 'refreshing' : 'initial']: true }));
        setErrors({ reservations: null, participants: null, schedules: null });
        const results = await Promise.allSettled([
          reservationApi.getAll(companyId, { pageSize: 500 }),
          participantApi.getAll(companyId, { pageSize: 500 }),
          eventScheduleApi.getAll(companyId, { pageSize: 500 }),
        ]);
        const newData = { reservations: [] as unknown[], participants: [] as unknown[], schedules: [] as unknown[] };
        const newErrors = { reservations: null as string | null, participants: null as string | null, schedules: null as string | null };
        if (results[0].status === 'fulfilled') newData.reservations = parseApiResponse(results[0].value);
        else newErrors.reservations = (results[0].reason as Error)?.message ?? t('overview.errorHint');
        if (results[1].status === 'fulfilled') newData.participants = parseApiResponse(results[1].value);
        else newErrors.participants = (results[1].reason as Error)?.message ?? t('overview.errorHint');
        if (results[2].status === 'fulfilled') newData.schedules = parseApiResponse(results[2].value);
        else newErrors.schedules = (results[2].reason as Error)?.message ?? t('overview.errorHint');
        setData(newData);
        setErrors(newErrors);
        setLastUpdated(new Date());
      } catch (_) {}
      finally {
        setLoading({ initial: false, refreshing: false });
      }
    },
    [companyId]
  );

  useEffect(() => {
    if (companyId) fetchDashboardData();
    else setLoading({ initial: false, refreshing: false });
  }, [companyId, fetchDashboardData]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const { reservations, participants, schedules } = data;
    const resList = reservations as Array<{ createdAt?: string; status?: string; isPaid?: boolean; eventSchedule?: { eventType?: { price?: number }; startTime?: string }; eventType?: { price?: number }; price?: number; totalPrice?: number; participants?: unknown[]; participantCount?: number }>;
    const schedList = schedules as Array<{ id?: string; startTime?: string; status?: string; eventType?: { name?: string }; name?: string; placeName?: string; location?: string }>;
    const currentMonthReservations = resList.filter((r) => {
      if (!r.createdAt) return false;
      const createdAt = new Date(r.createdAt);
      return createdAt >= currentMonthStart && createdAt <= now;
    });
    const previousMonthReservations = resList.filter((r) => {
      if (!r.createdAt) return false;
      const createdAt = new Date(r.createdAt);
      return createdAt >= previousMonthStart && createdAt <= previousMonthEnd;
    });
    const calculateRevenue = (list: typeof resList) =>
      list.reduce((sum, r) => {
        const price = r.eventSchedule?.eventType?.price ?? r.eventType?.price ?? r.price ?? r.totalPrice ?? 0;
        const count = r.participants?.length ?? r.participantCount ?? 1;
        return sum + Number(price) * count;
      }, 0);
    const upcomingEvents = schedList.filter((s) => {
      if (!s.startTime) return false;
      return new Date(s.startTime) >= now && s.status !== 'Cancelled';
    });
    const activeReservations = resList.filter((r) => r.status !== 'Cancelled');
    const paidReservations = activeReservations.filter((r) => r.isPaid).length;
    const unpaidReservations = activeReservations.filter((r) => !r.isPaid).length;
    const upcomingSchedules = [...upcomingEvents]
      .sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime())
      .slice(0, 5);
    const recentReservations = [...resList]
      .filter((r) => r.createdAt)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, 5);
    return {
      currentMonthReservations: currentMonthReservations.length,
      previousMonthReservations: previousMonthReservations.length,
      currentMonthRevenue: calculateRevenue(currentMonthReservations),
      previousMonthRevenue: calculateRevenue(previousMonthReservations),
      totalParticipants: (participants as unknown[]).length,
      upcomingEvents: upcomingEvents.length,
      paidReservations,
      unpaidReservations,
      upcomingSchedules,
      recentReservations,
    };
  }, [data]);

  const calculatePercentageChange = (current: number, previous: number) =>
    previous === 0 ? (current > 0 ? 100 : 0) : Number((((current - previous) / previous) * 100).toFixed(1));
  const localeTag = locale === 'pl' ? 'pl-PL' : 'en-US';
  const formatAmount = (amount: number) => new Intl.NumberFormat(localeTag, { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount || 0);
  const formatDate = (dateString?: string) =>
    dateString
      ? new Date(dateString).toLocaleDateString(localeTag, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '-';
  const formatTime = (date: Date) => date.toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' });
  const getMonthName = (offset = 0) => {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    return d.toLocaleDateString(localeTag, { month: 'long' });
  };

  if (!companyId) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <IconBuilding className="mb-3 h-12 w-12 text-primary-400 dark:text-primary-500" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('overview.noCompany')}</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('overview.noCompanyHint')}</p>
        </div>
      </div>
    );
  }

  if (loading.initial) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
        <div className="flex items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-transparent dark:border-zinc-600" />
          {t('overview.loading')}
        </div>
      </div>
    );
  }

  const hasAllErrors = errors.reservations && errors.participants && errors.schedules;
  if (hasAllErrors) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <IconAlert className="mb-3 h-12 w-12 text-amber-500 dark:text-amber-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('overview.error')}</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('overview.errorHint')}</p>
          <button type="button" onClick={() => fetchDashboardData(true)} className="mt-3 rounded-xl border border-primary-300 bg-primary-500/15 px-4 py-2.5 text-sm font-medium text-primary-700 dark:border-primary-600 dark:bg-primary-500/20 dark:text-primary-200">
            {t('common.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  const reservationChange = calculatePercentageChange(stats.currentMonthReservations, stats.previousMonthReservations);
  const revenueChange = calculatePercentageChange(stats.currentMonthRevenue, stats.previousMonthRevenue);
  const totalPayments = stats.paidReservations + stats.unpaidReservations;
  const paidPercentage = totalPayments > 0 ? (stats.paidReservations / totalPayments) * 100 : 0;
  const unpaidPercentage = totalPayments > 0 ? (stats.unpaidReservations / totalPayments) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{t('dashboard.overview')}</h1>
          {lastUpdated && (
            <span className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              <IconClock className="w-4 h-4" />
              {t('overview.updatedAt')} {formatTime(lastUpdated)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => fetchDashboardData(true)}
          disabled={loading.refreshing}
          className="rounded-xl border border-zinc-200 p-2.5 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          title={t('common.tryAgain')}
        >
          <IconRefresh className={`h-5 w-5 ${loading.refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {(errors.reservations || errors.participants || errors.schedules) && (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
          {errors.reservations && (
            <p className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
              <IconAlert className="w-4 h-4 shrink-0" />
              {t('overview.reservations')}: {errors.reservations}
            </p>
          )}
          {errors.participants && (
            <p className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
              <IconAlert className="w-4 h-4 shrink-0" />
              {t('participants.title')}: {errors.participants}
            </p>
          )}
          {errors.schedules && (
            <p className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
              <IconAlert className="w-4 h-4 shrink-0" />
              {t('overview.events')}: {errors.schedules}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <IconCalendar className="w-4 h-4 text-primary-500 dark:text-primary-400" />
            {t('overview.reservations')} ({getMonthName()})
          </div>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{stats.currentMonthReservations}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{reservationChange}% {t('overview.vs')} {getMonthName(-1)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <IconCurrency className="w-4 h-4 text-primary-500 dark:text-primary-400" />
            {t('overview.revenue')} ({getMonthName()})
          </div>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{formatAmount(stats.currentMonthRevenue)}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{revenueChange}% {t('overview.vs')} {getMonthName(-1)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <IconUsers className="w-4 h-4 text-primary-500 dark:text-primary-400" />
            {t('overview.totalParticipants')}
          </div>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{stats.totalParticipants}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <IconCalendar className="w-4 h-4 text-primary-500 dark:text-primary-400" />
            {t('overview.upcomingEvents')}
          </div>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{stats.upcomingEvents}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{t('overview.paymentStatus')}</h3>
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary-400" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{t('overview.paid')}</span>
            <div className="flex-1 h-2 rounded bg-zinc-100 dark:bg-zinc-800">
              <div className="h-full rounded bg-primary-400" style={{ width: `${paidPercentage}%` }} />
            </div>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{stats.paidReservations}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-400 dark:bg-rose-400" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{t('overview.unpaid')}</span>
            <div className="flex-1 h-2 rounded bg-zinc-100 dark:bg-zinc-800">
              <div className="h-full rounded bg-rose-400 dark:bg-rose-400" style={{ width: `${unpaidPercentage}%` }} />
            </div>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{stats.unpaidReservations}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
          <h3 className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
            <IconCalendar className="w-4 h-4 text-primary-500 dark:text-primary-400" />
            {t('overview.recentReservations')}
          </h3>
          {stats.recentReservations.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {stats.recentReservations.map((r: unknown) => {
                const res = r as { id: string; eventSchedule?: { eventType?: { name?: string } }; eventType?: { name?: string }; participants?: unknown[]; participantCount?: number; status?: string; createdAt?: string };
                const count = res.participants?.length ?? res.participantCount ?? 0;
                return (
                  <li key={res.id} className="flex items-center justify-between border-b border-zinc-100 py-2 dark:border-zinc-800">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{res.eventSchedule?.eventType?.name ?? res.eventType?.name ?? t('overview.event')}</span>
                      <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                        {count === 1 ? t('participants.personCount', { count }) : t('participants.peopleCount', { count })}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatDate(res.createdAt)}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{t('overview.noReservations')}</p>
          )}
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
          <h3 className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
            <IconClock className="w-4 h-4 text-primary-500 dark:text-primary-400" />
            {t('overview.upcoming')}
          </h3>
          {stats.upcomingSchedules.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {stats.upcomingSchedules.map((s, idx) => (
                <li key={s.id ?? idx} className="flex items-center justify-between border-b border-zinc-100 py-2 dark:border-zinc-800">
                  <div>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{s.eventType?.name ?? s.name ?? t('overview.event')}</span>
                    <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">{s.placeName ?? s.location ?? t('overview.noLocation')}</span>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatDate(s.startTime)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{t('overview.noUpcoming')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
