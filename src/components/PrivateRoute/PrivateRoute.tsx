import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';

interface PrivateRouteProps {
  children: ReactNode;
  requireCompany?: boolean;
}

const PrivateRoute = ({ children, requireCompany = false }: PrivateRouteProps) => {
  const { isAuthenticated, hasCompanySelected, loading } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center text-zinc-500 dark:text-zinc-400 text-sm">{t('loading')}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireCompany && !hasCompanySelected) {
    return <Navigate to="/select-company" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
