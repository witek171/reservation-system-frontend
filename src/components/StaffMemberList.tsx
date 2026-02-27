import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { staffMemberApi, specializationApi } from '../services/api.ts';
import { useAuth, StaffRole } from '../context/AuthContext.tsx';
import { useI18n } from '../context/I18nContext.tsx';
import ErrorModal from './common/ErrorModal.tsx';
import Pagination from './common/Pagination.tsx';
import RoleBadge from './common/RoleBadge.tsx';
import { IconAdd, IconCheck, IconClose, IconEdit, IconTrash, IconUsers } from './common/Icons.tsx';

const MAX_SPECS_VISIBLE = 3;

interface Spec { id: string; name: string }
interface StaffMemberItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: number | string;
  specializations?: Spec[];
}

const pageSize = 10;
const formInput =
  'w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 text-zinc-900 placeholder-zinc-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-primary-500 dark:focus:ring-primary-500/20';

const StaffMemberList = () => {
  const { t } = useI18n();
  const { selectedCompany } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [staffMembers, setStaffMembers] = useState<StaffMemberItem[]>([]);
  const [pagination, setPagination] = useState({ page: 0, pageSize, totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMemberItem | null>(null);
  const [specModalMember, setSpecModalMember] = useState<StaffMemberItem | null>(null);
  const [manageSpecsMember, setManageSpecsMember] = useState<StaffMemberItem | null>(null);
  const [companySpecializations, setCompanySpecializations] = useState<{ id: string; name: string }[]>([]);
  const [addSpecId, setAddSpecId] = useState('');
  const [addingSpec, setAddingSpec] = useState(false);
  const [specDropdownOpen, setSpecDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: StaffRole.Trainer,
  });

  const currentPage = Math.max(0, parseInt(searchParams.get('page') || '1', 10) - 1);
  const companyId = selectedCompany?.id;

  const fetchStaffMembers = useCallback(async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await staffMemberApi.getAll(companyId, { page: currentPage, pageSize });
      const data = response.data as { items?: StaffMemberItem[]; page?: number; pageSize?: number; totalCount?: number; totalPages?: number };
      setStaffMembers(data.items || []);
      setPagination({
        page: (data.page || 1) - 1,
        pageSize: data.pageSize || pageSize,
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.response?.data ?? e.message);
      setStaffMembers([]);
      setPagination({ page: 0, pageSize, totalCount: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [companyId, currentPage]);

  useEffect(() => {
    if (companyId) fetchStaffMembers();
  }, [fetchStaffMembers, companyId]);

  useEffect(() => {
    if (!companyId || !manageSpecsMember) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await specializationApi.getAll(companyId, { page: 0, pageSize: 500 });
        const data = res.data as { items?: { id: string; name: string }[] };
        if (!cancelled) setCompanySpecializations(data.items || []);
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, [companyId, manageSpecsMember?.id]);

  const refreshStaffMembers = async () => {
    if (!companyId) return;
    try {
      const response = await staffMemberApi.getAll(companyId, { page: currentPage, pageSize });
      const data = response.data as { items?: StaffMemberItem[]; page?: number; pageSize?: number; totalCount?: number; totalPages?: number };
      setStaffMembers(data.items || []);
      setPagination({
        page: (data.page || 1) - 1,
        pageSize: data.pageSize || pageSize,
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (_) {}
  };

  const handlePageChange = (newPage: number) => {
    const next = new URLSearchParams();
    if (newPage > 0) next.set('page', String(newPage + 1));
    setSearchParams(next, { replace: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        ...(formData.password && { password: formData.password }),
      };
      if (editingMember) {
        await staffMemberApi.update(companyId, editingMember.id, payload);
      } else {
        await staffMemberApi.create(companyId, { ...payload, password: formData.password });
      }
      await refreshStaffMembers();
      resetForm();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.response?.data ?? e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!companyId || !window.confirm(t('staff.deleteConfirm'))) return;
    try {
      await staffMemberApi.delete(companyId, id);
      await refreshStaffMembers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.message);
    }
  };

  const handleEdit = (member: StaffMemberItem) => {
    setEditingMember(member);
    let roleValue = member.role;
    if (typeof roleValue === 'string') roleValue = (StaffRole as Record<string, number>)[roleValue] ?? StaffRole.Trainer;
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      password: '',
      phone: member.phone || '',
      role: roleValue as number,
    });
    setShowForm(true);
  };

  const handleAddSpecialization = async () => {
    if (!companyId || !manageSpecsMember || !addSpecId) return;
    const addedName = companySpecializations.find((c) => c.id === addSpecId)?.name ?? '';
    try {
      setAddingSpec(true);
      setError(null);
      await staffMemberApi.addSpecialization(companyId, {
        staffMemberId: manageSpecsMember.id,
        specializationId: addSpecId,
      });
      setManageSpecsMember((prev) =>
        prev
          ? {
              ...prev,
              specializations: [...(prev.specializations || []), { id: addSpecId, name: addedName }],
            }
          : null
      );
      setAddSpecId('');
      setSpecDropdownOpen(false);
      await refreshStaffMembers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.response?.data ?? e.message);
    } finally {
      setAddingSpec(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      role: StaffRole.Trainer,
    });
    setEditingMember(null);
    setShowForm(false);
  };

  const getInitials = (first?: string, last?: string) =>
    `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();

  if (loading && staffMembers.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
        <div className="flex items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-transparent dark:border-zinc-600" />
          {t('loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ErrorModal error={error as string | { message?: string } | null} onClose={() => setError(null)} />

      {specModalMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 dark:bg-black/60 p-4" onClick={() => setSpecModalMember(null)}>
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-600 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-600 bg-zinc-50/80 dark:bg-zinc-800/50 rounded-t-2xl">
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                {t('staff.specializationsFor', { name: `${specModalMember.firstName} ${specModalMember.lastName}` })}
              </h4>
              <button type="button" onClick={() => setSpecModalMember(null)} className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors">
                <IconClose className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-3 max-h-64 overflow-y-auto">
              {specModalMember.specializations?.length ? (
                <ul className="space-y-1.5">
                  {specModalMember.specializations.map((s) => (
                    <li key={s.id} className="rounded-lg bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200">
                      {s.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('staff.noSpecs')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {manageSpecsMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 dark:bg-black/60 p-4" onClick={() => setManageSpecsMember(null)}>
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-600 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark w-full max-w-md overflow-visible" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-600 bg-zinc-50/80 dark:bg-zinc-800/50 rounded-t-2xl">
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                {t('staff.specializationsFor', { name: `${manageSpecsMember.firstName} ${manageSpecsMember.lastName}` })}
              </h4>
              <button type="button" onClick={() => setManageSpecsMember(null)} className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors">
                <IconClose className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('staff.specializations')}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {manageSpecsMember.specializations?.length ? (
                    manageSpecsMember.specializations.map((s) => (
                      <span key={s.id} className="inline-flex items-center rounded-lg bg-zinc-100 dark:bg-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-200">
                        {s.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{t('staff.noSpecs')}</span>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                  <div className="relative flex-1 min-w-0 max-w-[220px]">
                    <button
                      type="button"
                      onClick={() => setSpecDropdownOpen((o) => !o)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm flex items-center justify-between gap-2 transition-colors ${specDropdownOpen ? 'border-primary-400 ring-2 ring-primary-400/20 dark:border-primary-500 dark:ring-primary-500/20' : 'border-zinc-200 dark:border-zinc-700'} bg-zinc-50/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none`}
                    >
                      <span className={addSpecId ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'}>
                        {addSpecId ? companySpecializations.find((c) => c.id === addSpecId)?.name : t('staff.selectSpecialization')}
                      </span>
                      <svg className={`w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0 transition-transform ${specDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {specDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-[101]" aria-hidden onClick={() => setSpecDropdownOpen(false)} />
                        <ul className="absolute left-0 right-0 top-full z-[102] mt-1 max-h-48 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 shadow-lg py-1">
                          {companySpecializations
                            .filter((cs) => !manageSpecsMember.specializations?.some((es) => es.id === cs.id))
                            .map((cs) => (
                              <li key={cs.id}>
                                <button
                                  type="button"
                                  onClick={() => { setAddSpecId(cs.id); setSpecDropdownOpen(false); }}
                                  className="w-full px-3 py-2 text-left text-sm text-zinc-800 dark:text-zinc-200 hover:bg-primary-50 dark:hover:bg-primary-500/20 transition-colors"
                                >
                                  {cs.name}
                                </button>
                              </li>
                            ))}
                          {companySpecializations.filter((cs) => !manageSpecsMember.specializations?.some((es) => es.id === cs.id)).length === 0 && (
                            <li className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">{t('staff.noSpecs')}</li>
                          )}
                        </ul>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSpecialization}
                    disabled={!addSpecId || addingSpec}
                    className="rounded-xl border border-primary-300 bg-primary-500/15 px-4 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-500/25 dark:border-primary-600 dark:bg-primary-500/20 dark:text-primary-200 dark:hover:bg-primary-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingSpec ? '…' : t('staff.addSpecialization')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('staff.title')}</h3>
          {pagination.totalCount > 0 && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {pagination.totalCount === 1 ? t('staff.memberCount', { count: pagination.totalCount }) : t('staff.membersCount', { count: pagination.totalCount })}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
        >
          {showForm ? <><IconClose className="w-4 h-4" /> {t('common.cancel')}</> : <><IconAdd className="w-4 h-4" /> {t('staff.add')}</>}
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
              {editingMember ? t('staff.edit') : t('staff.new')}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('common.firstName')} *</label>
                <input type="text" className={formInput} placeholder={t('common.firstName')} value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required maxLength={40} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('common.lastName')} *</label>
                <input type="text" className={formInput} placeholder={t('common.lastName')} value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required maxLength={40} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('common.email')} *</label>
                <input type="email" className={formInput} placeholder={t('common.email')} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('common.phone')} *</label>
                <input type="tel" className={formInput} placeholder={t('common.phone')} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t('common.password')} {!editingMember && '*'}
                </label>
                <input type="password" className={formInput} placeholder={editingMember ? t('staff.passwordHint') : t('common.password')} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingMember} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('staff.role')} *</label>
                <select className={formInput} value={formData.role} onChange={(e) => setFormData({ ...formData, role: Number(e.target.value) })}>
                  <option value={StaffRole.Manager}>{t('role.manager')}</option>
                  <option value={StaffRole.ReceptionEmployee}>{t('role.reception')}</option>
                  <option value={StaffRole.Trainer}>{t('role.trainer')}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="rounded-xl border border-primary-300 bg-primary-500/15 px-4 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-500/25 dark:border-primary-600 dark:bg-primary-500/20 dark:text-primary-200 dark:hover:bg-primary-500/30 transition-colors">{editingMember ? t('common.update') : t('common.create')}</button>
              <button type="button" onClick={resetForm} className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors">{t('common.cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <>
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
            {staffMembers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                      <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">{t('common.name')}</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">{t('common.email')}</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">{t('common.phone')}</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">{t('staff.role')}</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">{t('staff.specializations')}</th>
                      <th className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">—</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffMembers.map((member) => (
                      <tr key={member.id} className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                              {getInitials(member.firstName, member.lastName)}
                            </div>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{member.firstName} {member.lastName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{member.email}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{member.phone || '-'}</td>
                        <td className="px-4 py-3">
                          <RoleBadge role={member.role} />
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                          {member.specializations?.length ? (
                            <>
                              {member.specializations.slice(0, MAX_SPECS_VISIBLE).map((s) => (
                                <span key={s.id} className="mr-1 inline-block rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-700">{s.name}</span>
                              ))}
                              {member.specializations.length > MAX_SPECS_VISIBLE && (
                                <button
                                  type="button"
                                  onClick={() => setSpecModalMember(member)}
                                  className="ml-0.5 inline-flex items-center gap-1 py-1 px-2 rounded-lg bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300 text-xs font-medium hover:bg-primary-200/50 dark:hover:bg-primary-500/30 transition-colors"
                                >
                                  +{member.specializations.length - MAX_SPECS_VISIBLE} {t('staff.viewAllSpecs')}
                                </button>
                              )}
                            </>
                          ) : (
                            t('staff.noSpecs')
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button type="button" onClick={() => handleEdit(member)} className="mr-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
                            <IconEdit className="w-4 h-4" /> {t('common.edit')}
                          </button>
                          <button type="button" onClick={() => { setManageSpecsMember(member); setAddSpecId(''); setSpecDropdownOpen(false); }} className="mr-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-500/20 transition-colors">
                            <IconCheck className="w-4 h-4" /> {t('staff.specializations')}
                          </button>
                          <button type="button" onClick={() => handleDelete(member.id)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                            <IconTrash className="w-4 h-4" /> {t('common.delete')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 h-12 w-12 text-primary-400 dark:text-primary-500">
                  <IconUsers className="h-full w-full" />
                </div>
                <h4 className="font-medium text-zinc-900 dark:text-zinc-100">{t('staff.noMembers')}</h4>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('staff.noMembersHint')}</p>
                <button type="button" onClick={() => setShowForm(true)} className="mt-3 flex items-center gap-2 rounded-xl border border-primary-300 bg-primary-500/15 px-4 py-2.5 text-sm font-medium text-primary-700 dark:border-primary-600 dark:bg-primary-500/20 dark:text-primary-200">
                  <IconAdd className="w-4 h-4" /> {t('staff.addFirst')}
                </button>
              </div>
            )}
          </div>
          <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} totalCount={pagination.totalCount} pageSize={pagination.pageSize} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  );
};

export default StaffMemberList;
