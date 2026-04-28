import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, StaffRole } from '../context/AuthContext.tsx';
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
  const {
    isManager,
    isTrainer,
    isReceptionEmployee,
    logout,
    clearCompanySelection,
    selectedCompany,
    staffMember,
    userRole,
  } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleChangeCompany = () => {
    clearCompanySelection();
    navigate('/select-company');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = (role: number | string | null | undefined) => {
    if (typeof role === 'string') {
      switch (role) {
        case 'Manager': return 'Manager';
        case 'ReceptionEmployee': return 'Recepcja';
        case 'Trainer': return 'Trener';
        default: return role;
      }
    }
    switch (role) {
      case StaffRole.Manager: return 'Manager';
      case StaffRole.ReceptionEmployee: return 'Recepcja';
      case StaffRole.Trainer: return 'Trener';
      default: return '-';
    }
  };

  const getInitials = () => {
    const first = (staffMember?.firstName as string)?.[0] || '';
    const last = (staffMember?.lastName as string)?.[0] || '';
    return `${first}${last}`.toUpperCase() || 'U';
  };

  const getCompanyAddress = () => {
    if (!selectedCompany) return '';
    const company = selectedCompany as any;
    if (company.address) return company.address;
    const streetPart = [company.street, company.buildingNumber, company.localNumber ? `/${company.localNumber}` : ''].filter(Boolean).join(' ');
    const cityPart = [company.postalCode || company.zipCode, company.city].filter(Boolean).join(' ');
    return [streetPart, cityPart].filter(Boolean).join(', ') || '';
  };

  const roleLabel = getRoleLabel(userRole ?? staffMember?.role);
  const companyAddress = getCompanyAddress();

  const managerTabs: TabItem[] = [
    { id: 'overview', path: '/dashboard/overview', labelKey: 'dashboard.overview', icon: 'dashboard', component: DashboardOverview },
    { id: 'reservations', path: '/dashboard/reservations', labelKey: 'dashboard.reservations', icon: 'event_note', component: ReservationList },
    { id: 'schedules', path: '/dashboard/schedules', labelKey: 'dashboard.schedule', icon: 'calendar_today', component: EventCalendar },
    { id: 'eventTypes', path: '/dashboard/eventTypes', labelKey: 'dashboard.eventTypes', icon: 'event', component: EventTypeList },
    { id: 'participants', path: '/dashboard/participants', labelKey: 'dashboard.participants', icon: 'groups', component: ParticipantList },
    { id: 'staff', path: '/dashboard/staff', labelKey: 'dashboard.staff', icon: 'engineering', component: StaffMemberList },
    { id: 'specializations', path: '/dashboard/specializations', labelKey: 'dashboard.specializations', icon: 'school', component: SpecializationList },
    { id: 'settings', path: '/dashboard/settings', labelKey: 'dashboard.settings', icon: 'settings', component: CompanySettings },
  ];

  const trainerTabs: TabItem[] = [
    { id: 'classes', path: '/dashboard/classes', labelKey: 'dashboard.myCalendar', icon: 'calendar_today', component: TrainerClassesCalendar },
    { id: 'availability', path: '/dashboard/availability', labelKey: 'dashboard.myAvailability', icon: 'schedule', component: AvailabilityCalendar },
  ];

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
    setSidebarOpen(false);
  };

  const ReceptionNoAccessView = () => (
    <div className="flex flex-col items-center justify-center min-h-[360px] p-lg bg-surface-container-lowest rounded-xl border border-surface-variant text-center">
      <h2 className="font-h2 text-h2 text-on-surface mb-sm">{t('dashboard.welcome')}</h2>
      <p className="font-body-md text-body-md text-on-surface-variant mb-xs">{t('reception.noAccess')}</p>
      <p className="font-body-sm text-body-sm text-outline">{t('reception.noAccessHint')}</p>
    </div>
  );

  const NotFoundPlaceholder = () => (
    <div className="flex flex-col items-center justify-center min-h-[360px] p-lg bg-surface-container-lowest rounded-xl border border-surface-variant text-center">
      <h2 className="font-h2 text-h2 text-on-surface mb-sm">{t('dashboard.pageNotFound')}</h2>
      <p className="font-body-md text-body-md text-on-surface-variant">{t('dashboard.pageNotFoundHint')}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* ====== Mobile Top Bar ====== */}
      <header className="fixed top-0 left-0 right-0 z-30 md:hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        {/* Wiersz 1: Hamburger + Firma + Avatar */}
        <div className="flex items-center justify-between h-12 px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-700 dark:text-slate-300">menu</span>
          </button>

          <div className="flex-1 min-w-0 mx-3">
            <div className="flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-slate-400">business</span>
              <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {selectedCompany?.name || 'Bookium'}
              </span>
            </div>
          </div>

          <div className="h-8 w-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold shrink-0">
            {getInitials()}
          </div>
        </div>

        {/* Wiersz 2: Adres + Imię/Rola */}
        <div className="flex items-center justify-between h-10 px-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          {/* Adres */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="material-symbols-outlined text-[14px] text-slate-400 shrink-0">location_on</span>
            <span className="truncate text-xs text-slate-500 dark:text-slate-400">
              {companyAddress || 'Brak adresu'}
            </span>
          </div>

          {/* Imię + Rola */}
          <div className="flex items-center gap-2 ml-3 shrink-0">
            <div className="text-right">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-tight">
                {staffMember?.firstName as string} {staffMember?.lastName as string}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                {roleLabel}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ====== Desktop Navbar ====== */}
      <Navbar />

      {/* ====== Mobile Sidebar Overlay ====== */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ====== Sidebar ====== */}
      {availableTabs.length > 0 && (
        <aside
          className={`
            fixed left-0 top-0 h-full z-50 p-4
            bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100
            font-sans text-sm font-medium tracking-tight
            w-64 border-r border-slate-200 dark:border-slate-800
            flex flex-col shadow-sm dark:shadow-none
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0
          `}
        >
          {/* Sidebar Header */}
          <div className="mb-6 px-4 flex items-center justify-between">
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tighter">Bookium</div>
              <div className="text-slate-500 text-xs">System B2B</div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                <span className="font-body-md text-body-md">{t(tab.labelKey)}</span>
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="mt-auto border-t border-slate-200 dark:border-slate-800 pt-4">
            <ul className="flex flex-col gap-1">
              <li>
                <button
                  type="button"
                  onClick={handleChangeCompany}
                  className="flex w-full items-center gap-3 px-4 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="material-symbols-outlined">swap_horiz</span>
                  {t('nav.changeCompany')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="material-symbols-outlined">logout</span>
                  {t('nav.logout')}
                </button>
              </li>
            </ul>
          </div>
        </aside>
      )}

      {/* ====== Main Content ====== */}
      <main className="w-full md:ml-64 pt-[88px] md:pt-16 min-h-screen">
        <div className="p-4 md:p-8">
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
            <div className="flex flex-col items-center justify-center min-h-[360px] p-lg bg-surface-container-lowest rounded-xl border border-surface-variant text-center">
              <h2 className="font-h2 text-h2 text-on-surface mb-sm">{t('dashboard.welcome')}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">{t('dashboard.pageNotFoundHint')}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;