import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authApi, staffMemberCompanyApi } from '../services/api';
import { StaffRole, LOCAL_STORAGE_KEYS } from '../constants/constants';
import type { Company, StaffMember, User } from '../types/api';

export { StaffRole };
export type StaffRoleValue = number;

export const parseRole = (roleString: string | number | undefined): StaffRoleValue => {
  if (typeof roleString === 'number') return roleString;
  const roleMap: Record<string, StaffRoleValue> = {
    Manager: StaffRole.Manager,
    ReceptionEmployee: StaffRole.ReceptionEmployee,
    Trainer: StaffRole.Trainer,
  };
  return roleMap[String(roleString)] ?? StaffRole.Trainer;
};

export const getRoleName = (role: StaffRoleValue | string): string => {
  if (typeof role === 'string') return role;
  switch (role) {
    case StaffRole.Manager:
      return 'Manager';
    case StaffRole.ReceptionEmployee:
      return 'Reception Employee';
    case StaffRole.Trainer:
      return 'Trainer';
    default:
      return 'Unknown';
  }
};

interface AuthContextValue {
  user: User | null;
  staffMember: StaffMember | null;
  token: string | null;
  selectedCompany: Company | null;
  companies: Company[];
  userRole: StaffRoleValue | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: unknown }>;
  logout: () => void;
  selectCompany: (company: Company | null) => void;
  clearCompanySelection: () => void;
  isManager: () => boolean;
  isReceptionEmployee: () => boolean;
  isTrainer: () => boolean;
  isAuthenticated: boolean;
  hasCompanySelected: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN));
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<StaffRoleValue | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
      const savedUser = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
      const savedCompany = localStorage.getItem(LOCAL_STORAGE_KEYS.SELECTED_COMPANY);
      const savedRole = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ROLE);
      const savedStaffMember = localStorage.getItem(LOCAL_STORAGE_KEYS.STAFF_MEMBER);

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser) as User);
        if (savedCompany) setSelectedCompany(JSON.parse(savedCompany) as Company);
        if (savedRole !== null) setUserRole(parseInt(savedRole, 10) as StaffRoleValue);
        if (savedStaffMember) setStaffMember(JSON.parse(savedStaffMember) as StaffMember);

        try {
          const response = await staffMemberCompanyApi.getCompanies();
          const { staffMember: staff, companies: companiesList } = response.data;
          setStaffMember(staff as StaffMember);
          setCompanies((companiesList || []) as Company[]);
          localStorage.setItem(LOCAL_STORAGE_KEYS.STAFF_MEMBER, JSON.stringify(staff));
          if (savedRole === null && (staff as StaffMember)?.role) {
            const parsedRole = parseRole((staff as StaffMember).role);
            setUserRole(parsedRole);
            localStorage.setItem(LOCAL_STORAGE_KEYS.USER_ROLE, String(parsedRole));
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const logout = useCallback(() => {
    Object.values(LOCAL_STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    setToken(null);
    setUser(null);
    setStaffMember(null);
    setSelectedCompany(null);
    setCompanies([]);
    setUserRole(null);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: unknown }> => {
      try {
        const response = await authApi.login({ email, password });
        const { token: newToken, ...userData } = response.data as { token: string } & User;
        localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, newToken);
        localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);

        const companiesResponse = await staffMemberCompanyApi.getCompanies();
        const { staffMember: staff, companies: companiesList } = companiesResponse.data;
        setStaffMember(staff as StaffMember);
        setCompanies((companiesList || []) as Company[]);
        localStorage.setItem(LOCAL_STORAGE_KEYS.STAFF_MEMBER, JSON.stringify(staff));
        if ((staff as StaffMember)?.role) {
          const parsedRole = parseRole((staff as StaffMember).role);
          setUserRole(parsedRole);
          localStorage.setItem(LOCAL_STORAGE_KEYS.USER_ROLE, String(parsedRole));
        }
        return { success: true };
      } catch (error: unknown) {
        const err = error as { response?: { data?: unknown } };
        return { success: false, error: err.response?.data };
      }
    },
    []
  );

  const selectCompany = useCallback((company: Company | null) => {
    setSelectedCompany(company);
    if (company) localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_COMPANY, JSON.stringify(company));
  }, []);

  const clearCompanySelection = useCallback(() => {
    setSelectedCompany(null);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.SELECTED_COMPANY);
  }, []);

  const isManager = () => userRole === StaffRole.Manager;
  const isReceptionEmployee = () => userRole === StaffRole.ReceptionEmployee;
  const isTrainer = () => userRole === StaffRole.Trainer;

  const value: AuthContextValue = {
    user,
    staffMember,
    token,
    selectedCompany,
    companies,
    userRole,
    loading,
    login,
    logout,
    selectCompany,
    clearCompanySelection,
    isManager,
    isReceptionEmployee,
    isTrainer,
    isAuthenticated: !!token,
    hasCompanySelected: !!selectedCompany,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
