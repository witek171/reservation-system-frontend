import { useAuth, StaffRole } from '../context/AuthContext.tsx';

const Navbar = () => {
  const { staffMember, selectedCompany, userRole } = useAuth();

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
    const first = staffMember?.firstName?.[0] || '';
    const last = staffMember?.lastName?.[0] || '';
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

  return (
    <header className="hidden md:flex fixed top-0 z-30 ml-64 w-[calc(100%-16rem)] h-16 items-center justify-between px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      {/* Lewa strona — firma */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-slate-500">business</span>
          <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {selectedCompany?.name || 'Brak firmy'}
          </span>
        </div>
        {companyAddress && (
          <div className="truncate text-xs text-slate-500 dark:text-slate-400 ml-[26px]">
            {companyAddress}
          </div>
        )}
      </div>

      {/* Prawa strona — użytkownik */}
      <div className="ml-6 flex shrink-0 items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-6">
        <div className="text-right">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            {staffMember?.firstName || ''} {staffMember?.lastName || ''}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {roleLabel}
          </div>
        </div>
        <div className="h-9 w-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold">
          {getInitials()}
        </div>
      </div>
    </header>
  );
};

export default Navbar;