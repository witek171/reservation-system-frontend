import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../context/I18nContext.tsx';
import Navbar from '../components/Navbar.tsx';
import DashboardOverview from '../components/DashboardOverview.tsx';
import StaffMemberList from '../components/StaffMemberList.tsx';
import ReservationList from '../components/ReservationList/ReservationList.tsx';
import EventCalendar from '../components/EventCalendar/EventCalendar.tsx';
import TrainerClassesCalendar from '../components/TrainerClassesCalendar.tsx';
import AvailabilityCalendar from '../components/AvailabilityCalendar/AvailabilityCalendar.tsx';
import EventTypeList from '../components/EventTypeList.tsx';
import ParticipantList from '../components/ParticipantList.tsx';
import SpecializationList from '../components/SpecializationList.tsx';
import CompanySettings from '../components/CompanySettings.tsx';

type TabItem = {
  id: string;
  path: string;
  labelKey: string;
  icon: string;
  component: React.ComponentType;
};

const DashboardPage = () => {
  const { isManager, isTrainer, isReceptionEmployee } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const managerTabs: TabItem[] = [
    { id: 'overview', path: '/dashboard/overview', labelKey: 'dashboard.overview', icon: 'dashboard', component: DashboardOverview },
    { id: 'reservations', path: '/dashboard/reservations', labelKey: 'dashboard.reservations', icon: 'calendar', component: ReservationList },
    { id: 'schedules', path: '/dashboard/schedules', labelKey: 'dashboard.schedule', icon: 'clock', component: EventCalendar },
    { id: 'eventTypes', path: '/dashboard/eventTypes', labelKey: 'dashboard.eventTypes', icon: 'layers', component: EventTypeList },
    { id: 'participants', path: '/dashboard/participants', labelKey: 'dashboard.participants', icon: 'users', component: ParticipantList },
    { id: 'staff', path: '/dashboard/staff', labelKey: 'dashboard.staff', icon: 'user-plus', component: StaffMemberList },
    { id: 'specializations', path: '/dashboard/specializations', labelKey: 'dashboard.specializations', icon: 'check-circle', component: SpecializationList },
    { id: 'settings', path: '/dashboard/settings', labelKey: 'dashboard.settings', icon: 'settings', component: CompanySettings },
  ];

  const trainerTabs: TabItem[] = [
    { id: 'classes', path: '/dashboard/classes', labelKey: 'dashboard.myCalendar', icon: 'calendar', component: TrainerClassesCalendar },
    { id: 'availability', path: '/dashboard/availability', labelKey: 'dashboard.myAvailability', icon: 'availability', component: AvailabilityCalendar },
  ];

  // Backend: ReceptionEmployee has no dedicated endpoints (only [Authorize] on staffMember/companies).
  // Show only a single "no access" view - no tabs that call Manager APIs.
  const receptionEmployeeTabs: TabItem[] = [];

  const availableTabs = isManager() ? managerTabs : isTrainer() ? trainerTabs : receptionEmployeeTabs;

  const getActiveTab = () => {
    const currentPath = location.pathname;
    const exactMatch = availableTabs.find((tab) => tab.path === currentPath);
    if (exactMatch) return exactMatch.id;
    const partialMatch = availableTabs.find((tab) => tab.path !== '/dashboard' && currentPath.startsWith(tab.path));
    if (partialMatch) return partialMatch.id;
    return isManager() ? 'overview' : isTrainer() ? 'classes' : '';
  };

  const activeTab = getActiveTab();

  const handleTabClick = (tab: TabItem) => {
    navigate(tab.path);
  };

  const getIcon = (iconName: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      dashboard: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
      calendar: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      clock: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      availability: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <polyline points="9 15 11 17 15 13" />
        </svg>
      ),
      layers: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
      users: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      'user-plus': (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      ),
      'check-circle': (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      settings: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    };
    return icons[iconName] ?? icons.dashboard;
  };

  const ReceptionNoAccessView = () => (
    <div className="flex flex-col items-center justify-center min-h-[360px] p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">{t('dashboard.welcome')}</h2>
      <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-1">{t('reception.noAccess')}</p>
      <p className="text-zinc-500 dark:text-zinc-500 text-xs">{t('reception.noAccessHint')}</p>
    </div>
  );

  const NotFoundPlaceholder = () => (
    <div className="flex flex-col items-center justify-center min-h-[360px] p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">{t('dashboard.pageNotFound')}</h2>
      <p className="text-zinc-500 dark:text-zinc-400 text-sm">{t('dashboard.pageNotFoundHint')}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {availableTabs.length > 0 && (
          <aside
            className={`flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-[width] duration-200 shrink-0 ${
              sidebarCollapsed ? 'w-[64px]' : 'w-[220px]'
            }`}
          >
            <div className="flex items-center justify-between h-12 px-2 border-b border-zinc-100 dark:border-zinc-800">
              {!sidebarCollapsed && <span className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">{t('nav.menu')}</span>}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  {sidebarCollapsed ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
                </svg>
              </button>
            </div>
            <nav className="p-1.5 flex flex-col gap-0.5 overflow-y-auto">
              {availableTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab)}
                  className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-left text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-200 border border-primary-200/50 dark:border-primary-500/30'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent'
                  }`}
                  title={sidebarCollapsed ? t(tab.labelKey) : undefined}
                >
                  <span className="w-5 h-5 flex-shrink-0 [&>svg]:w-full [&>svg]:h-full">{getIcon(tab.icon)}</span>
                  {!sidebarCollapsed && <span>{t(tab.labelKey)}</span>}
                </button>
              ))}
            </nav>
          </aside>
        )}

        <main className="flex-1 overflow-auto min-w-0 pl-3 pr-4 py-4 md:pl-4 md:pr-6 md:py-5">
          <div className="max-w-[1600px] mx-auto">
            {isManager() && (
              <Routes>
                <Route index element={<DashboardOverview />} />
                <Route path="overview" element={<DashboardOverview />} />
                <Route path="reservations" element={<ReservationList />} />
                <Route path="schedules" element={<EventCalendar />} />
                <Route path="eventTypes" element={<EventTypeList />} />
                <Route path="participants" element={<ParticipantList />} />
                <Route path="staff" element={<StaffMemberList />} />
                <Route path="specializations" element={<SpecializationList />} />
                <Route path="settings" element={<CompanySettings />} />
                <Route path="*" element={<NotFoundPlaceholder />} />
              </Routes>
            )}
            {isTrainer() && (
              <Routes>
                <Route index element={<TrainerClassesCalendar />} />
                <Route path="classes" element={<TrainerClassesCalendar />} />
                <Route path="availability" element={<AvailabilityCalendar />} />
                <Route path="*" element={<NotFoundPlaceholder />} />
              </Routes>
            )}
            {isReceptionEmployee() && <ReceptionNoAccessView />}
            {!isManager() && !isTrainer() && !isReceptionEmployee() && (
              <div className="flex flex-col items-center justify-center min-h-[360px] p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">{t('dashboard.welcome')}</h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">{t('dashboard.pageNotFoundHint')}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
