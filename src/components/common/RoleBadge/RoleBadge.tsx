import { useI18n } from '../../../context/I18nContext';
import { StaffRole } from '../../../constants/constants';

interface RoleBadgeProps {
  role: string | number;
}

const roleKeys: Record<number, string> = {
  [StaffRole.Manager]: 'role.manager',
  [StaffRole.ReceptionEmployee]: 'role.reception',
  [StaffRole.Trainer]: 'role.trainer',
};

const roleClasses: Record<number, string> = {
  [StaffRole.Manager]: 'bg-blue-50 text-blue-600 dark:bg-blue-900/25 dark:text-blue-300',
  [StaffRole.ReceptionEmployee]: 'bg-amber-50 text-amber-600 dark:bg-amber-900/25 dark:text-amber-300',
  [StaffRole.Trainer]: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-300',
};

const RoleBadge = ({ role }: RoleBadgeProps) => {
  const { t } = useI18n();
  const roleNum = typeof role === 'string' ? (StaffRole as Record<string, number>)[role] : role;
  const variant = roleClasses[roleNum as number] ?? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300';
  const label = roleKeys[roleNum as number] ? t(roleKeys[roleNum as number]) : t('role.unknown');

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variant}`}>
      {label}
    </span>
  );
};

export default RoleBadge;
