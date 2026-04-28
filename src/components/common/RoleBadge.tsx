import { useI18n } from '../../context/I18nContext.tsx';
import { StaffRole } from '../../constants/constants.ts';

interface RoleBadgeProps {
  role: string | number;
}

const roleKeys: Record<number, string> = {
  [StaffRole.Manager]: 'role.manager',
  [StaffRole.ReceptionEmployee]: 'role.reception',
  [StaffRole.Trainer]: 'role.trainer',
};

const roleVariants: Record<number, string> = {
  [StaffRole.Manager]:
    'bg-primary-container text-on-primary border border-primary-container shadow-sm',
  [StaffRole.ReceptionEmployee]:
    'bg-on-tertiary-container text-white border border-on-tertiary-container shadow-sm',
  [StaffRole.Trainer]:
    'bg-secondary text-on-secondary border border-secondary shadow-sm',
};

const parseRoleValue = (role: string | number): number | undefined => {
  if (typeof role === 'number') return role;

  const roleMap: Record<string, number> = {
    Manager: StaffRole.Manager,
    ReceptionEmployee: StaffRole.ReceptionEmployee,
    Trainer: StaffRole.Trainer,
  };

  return roleMap[role];
};

const RoleBadge = ({ role }: RoleBadgeProps) => {
  const { t } = useI18n();

  const roleNum = parseRoleValue(role);

  const label =
    roleNum !== undefined && roleKeys[roleNum]
      ? t(roleKeys[roleNum])
      : t('role.unknown');

  const variant =
    roleNum !== undefined
      ? roleVariants[roleNum] ?? 'bg-surface-container text-on-surface border border-outline-variant'
      : 'bg-surface-container text-on-surface border border-outline-variant';

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide whitespace-nowrap ${variant}`}
    >
      {label}
    </span>
  );
};

export default RoleBadge;