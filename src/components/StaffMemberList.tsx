import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { staffMemberApi, specializationApi } from '../services/api.ts';
import { useAuth, StaffRole } from '../context/AuthContext.tsx';
import { useI18n } from '../context/I18nContext.tsx';
import ErrorModal from './common/ErrorModal.tsx';
import { IconClose } from './common/Icons.tsx';
import RoleBadge from './common/RoleBadge.tsx';
import ModalPortal from './common/ModalPortal.tsx';
import Pagination from './common/Pagination.tsx';
import SearchBar from './common/SearchBar.tsx';
import Select from './common/Select.tsx';
import type { SelectOption } from './common/Select.tsx';
import { formatPhone } from '../utils/formatPhone.ts';

const MAX_SPECS_VISIBLE = 3;

interface Spec {
  id: string;
  name: string;
}

interface StaffMemberItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: number | string;
  specializations?: Spec[];
}

const createInitialFormData = () => ({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  role: StaffRole.Trainer,
});

/* ─── Main Component ─── */
const StaffMemberList = () => {
  const { t } = useI18n();
  const { selectedCompany } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [staffMembers, setStaffMembers] = useState<StaffMemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | { message?: string } | null>(null);
  const [companySpecializations, setCompanySpecializations] = useState<
    { id: string; name: string }[]
  >([]);
  const [addSpecId, setAddSpecId] = useState('');
  const [addingSpec, setAddingSpec] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [actionsDropdownOpen, setActionsDropdownOpen] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [mobileActionsMember, setMobileActionsMember] = useState<StaffMemberItem | null>(null);
  const [formData, setFormData] = useState(createInitialFormData());
  const [modalMember, setModalMember] = useState<StaffMemberItem | null>(null);

  const listTopRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToTopRef = useRef(false);

  const pageSize = 10;
  const currentPage = Math.max(0, parseInt(searchParams.get('page') || '1', 10) - 1);
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: pageSize,
    totalCount: 0,
    totalPages: 1,
  });

  const companyId = selectedCompany?.id;

  // --- URL-driven modal state ---
  const modalType = searchParams.get('modal');
  const modalId = searchParams.get('id');

  const showForm = modalType === 'create' || (modalType === 'edit' && !!modalMember);
  const editingMember = modalType === 'edit' ? modalMember : null;
  const specModalMember = modalType === 'specs' ? modalMember : null;
  const manageSpecsMember = modalType === 'manage-specs' ? modalMember : null;

  const routeModalNeedsMember =
    modalType === 'edit' || modalType === 'specs' || modalType === 'manage-specs';
  const routeModalWaitingForMember = routeModalNeedsMember && !!modalId && !modalMember;

  // --- Role options ---
  const roleOptions: SelectOption[] = [
    { value: StaffRole.Manager, label: t('role.manager') },
    { value: StaffRole.ReceptionEmployee, label: t('role.reception') },
    { value: StaffRole.Trainer, label: t('role.trainer') },
  ];

  // --- Helpers ---
  const applyMemberToForm = useCallback((member: StaffMemberItem) => {
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      password: '',
      phone: member.phone || '',
      role: typeof member.role === 'string' ? parseInt(member.role, 10) : member.role,
    });
  }, []);

  const closeDropdown = useCallback(() => {
    setActionsDropdownOpen(null);
    setDropdownPosition(null);
  }, []);

  const openCreateModal = useCallback(() => {
    setSearchParams({ modal: 'create' }, { replace: false });
    setModalMember(null);
    setFormData(createInitialFormData());
    closeDropdown();
  }, [setSearchParams, closeDropdown]);

  const openEditModal = useCallback(
    (member: StaffMemberItem) => {
      const params = new URLSearchParams(searchParams);
      params.set('modal', 'edit');
      params.set('id', member.id);
      setModalMember(member);
      applyMemberToForm(member);
      closeDropdown();
      setMobileActionsMember(null);
      setSearchParams(params, { replace: false });
    },
    [searchParams, setSearchParams, applyMemberToForm, closeDropdown]
  );

  const openSpecsModal = useCallback(
    (member: StaffMemberItem) => {
      const params = new URLSearchParams(searchParams);
      params.set('modal', 'specs');
      params.set('id', member.id);
      setModalMember(member);
      closeDropdown();
      setMobileActionsMember(null);
      setSearchParams(params, { replace: false });
    },
    [searchParams, setSearchParams, closeDropdown]
  );

  const openManageSpecsModal = useCallback(
    (member: StaffMemberItem) => {
      const params = new URLSearchParams(searchParams);
      params.set('modal', 'manage-specs');
      params.set('id', member.id);
      setModalMember(member);
      closeDropdown();
      setMobileActionsMember(null);
      setSearchParams(params, { replace: false });
    },
    [searchParams, setSearchParams, closeDropdown]
  );

  const closeModal = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    params.delete('modal');
    params.delete('id');
    setModalMember(null);
    setAddSpecId('');
    setFormData(createInitialFormData());
    closeDropdown();
    setMobileActionsMember(null);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams, closeDropdown]);

  const resetForm = () => closeModal();

  // --- Sync URL modal → modalMember state ---
  useEffect(() => {
    if (!companyId) return;

    if (modalType === 'create') {
      setModalMember(null);
      setFormData(createInitialFormData());
      return;
    }

    if (!routeModalNeedsMember) {
      setModalMember(null);
      return;
    }

    if (!modalId) return;

    const memberFromList = staffMembers.find((m) => m.id === modalId);
    if (memberFromList) {
      setModalMember(memberFromList);
      if (modalType === 'edit') applyMemberToForm(memberFromList);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const api = staffMemberApi as any;
        if (typeof api.getById !== 'function') return;
        const response = await api.getById(companyId, modalId);
        const member = response.data as StaffMemberItem;
        if (cancelled) return;
        setModalMember(member);
        if (modalType === 'edit') applyMemberToForm(member);
      } catch (err: unknown) {
        if (cancelled) return;
        const e = err as any;
        setError(e.response?.data?.message ?? e.response?.data ?? e.message ?? null);
        setModalMember(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [companyId, modalType, modalId, staffMembers, applyMemberToForm, routeModalNeedsMember]);

  // --- Fetch company specializations when manage-specs opens ---
  useEffect(() => {
    if (!companyId || modalType !== 'manage-specs' || !modalMember) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await specializationApi.getAll(companyId, { page: 0, pageSize: 500 });
        const data = res.data as any;
        if (!cancelled) setCompanySpecializations(data.items || []);
      } catch (_) {}
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId, modalType, modalMember?.id]);

  // --- Fetch staff members ---
  const fetchStaffMembers = useCallback(async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      setError(null);
      const params: any = { page: currentPage, pageSize };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const response = await staffMemberApi.getAll(companyId, params);
      const data = response.data as any;
      setStaffMembers(data.items || []);
      setPagination({
        page: currentPage,
        pageSize: data.pageSize || pageSize,
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (err: unknown) {
      const e = err as any;
      setError(e.response?.data?.message ?? e.response?.data ?? e.message ?? null);
      setStaffMembers([]);
      setPagination({ page: 0, pageSize, totalCount: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [companyId, searchQuery, currentPage, pageSize]);

  useEffect(() => {
    if (companyId) fetchStaffMembers();
  }, [fetchStaffMembers, companyId]);

  // --- Scroll to top after page change on mobile ---
  useEffect(() => {
    if (!shouldScrollToTopRef.current || loading) return;

    shouldScrollToTopRef.current = false;

    requestAnimationFrame(() => {
      listTopRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }, [loading, pagination.page]);

  // --- Sync search query to URL ---
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      newParams.set('search', searchQuery.trim());
    } else {
      newParams.delete('search');
    }
    newParams.delete('page');
    setSearchParams(newParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // --- Pagination ---
  const handlePageChange = (newPage: number) => {
    shouldScrollToTopRef.current = true;
    const newParams = new URLSearchParams(searchParams);
    if (newPage > 0) {
      newParams.set('page', String(newPage + 1));
    } else {
      newParams.delete('page');
    }
    if (searchQuery.trim()) {
      newParams.set('search', searchQuery.trim());
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams, { replace: false });
  };

  // --- Refresh list ---
  const refreshStaffMembers = async () => {
    if (!companyId) return;
    try {
      const params: any = { page: currentPage, pageSize };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const response = await staffMemberApi.getAll(companyId, params);
      const data = response.data as any;
      setStaffMembers(data.items || []);
      setPagination({
        page: currentPage,
        pageSize: data.pageSize || pageSize,
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (_) {}
  };

  // --- Form submit ---
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
      const e = err as any;
      setError(e.response?.data?.message ?? e.response?.data ?? e.message ?? null);
    }
  };

  // --- Specializations ---
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
      setModalMember((prev) =>
        prev
          ? {
            ...prev,
            specializations: [
              ...(prev.specializations || []),
              { id: addSpecId, name: addedName },
            ],
          }
          : null
      );
      setAddSpecId('');
      await refreshStaffMembers();
    } catch (err: unknown) {
      const e = err as any;
      setError(e.response?.data?.message ?? e.response?.data ?? e.message ?? null);
    } finally {
      setAddingSpec(false);
    }
  };

  const handleRemoveSpecialization = async (
    _staffMemberId: string,
    staffMemberSpecializationId: string
  ) => {
    if (!companyId) return;
    try {
      setError(null);
      await staffMemberApi.removeSpecialization(companyId, staffMemberSpecializationId);
      setModalMember((prev) =>
        prev
          ? {
            ...prev,
            specializations:
              prev.specializations?.filter((s) => s.id !== staffMemberSpecializationId) || [],
          }
          : null
      );
      await refreshStaffMembers();
    } catch (err: unknown) {
      const e = err as any;
      setError(e.response?.data?.message ?? e.response?.data ?? e.message ?? null);
    }
  };

  // --- Delete ---
  const handleDeleteMember = async (member: StaffMemberItem) => {
    if (!companyId || !window.confirm(t('common.confirmDelete'))) return;
    try {
      setError(null);
      await staffMemberApi.delete(companyId, member.id);
      closeDropdown();
      setMobileActionsMember(null);
      await refreshStaffMembers();
    } catch (err: unknown) {
      const e = err as any;
      setError(e.response?.data?.message ?? e.response?.data ?? e.message ?? null);
    }
  };

  // --- Close dropdown on scroll or resize ---
  useEffect(() => {
    if (!actionsDropdownOpen) return;
    const close = () => closeDropdown();
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [actionsDropdownOpen, closeDropdown]);

  const getInitials = (first?: string, last?: string) =>
    `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();

  if (loading && staffMembers.length === 0) {
    return (
      <div className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-8">
        <div className="flex items-center justify-center gap-3 text-on-surface-variant">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
          {t('loading')}
        </div>
      </div>
    );
  }

  const closeBtnClass =
    'h-9 w-9 inline-flex items-center justify-center rounded-full text-outline hover:text-on-surface hover:bg-surface-variant transition-colors';

  // --- Spec select options for manage-specs modal ---
  const availableSpecOptions: SelectOption[] = manageSpecsMember
    ? companySpecializations
      .filter((cs) => !manageSpecsMember.specializations?.some((es) => es.id === cs.id))
      .map((cs) => ({ value: cs.id, label: cs.name }))
    : [];

  return (
    <div className="space-y-6">
      {error && <ErrorModal error={error} onClose={() => setError(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-h2 text-h2 text-on-surface">{t('staff.title')}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Zarządzaj pracownikami, przypisuj role i specjalizacje.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="bg-secondary hover:bg-secondary-fixed-variant text-on-secondary font-label-bold text-label-bold py-3 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          {t('staff.add')}
        </button>
      </div>

      {/* Table Card */}
      <div
        ref={listTopRef}
        className="w-full bg-surface-container-lowest rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-surface-variant overflow-hidden scroll-mt-24"
      >
        {/* Search */}
        <div className="p-4 md:p-6 border-b border-surface-variant flex flex-col gap-4 bg-surface-bright">
          <SearchBar
            className="w-full sm:w-96"
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            placeholder="Szukaj pracownika..."
            debounceMs={300}
            maxLength={100}
            loading={loading && searchQuery.trim() !== ''}
            resultCount={searchQuery.trim() ? pagination.totalCount : null}
          />
        </div>

        {/* Desktop Table */}
        <div className="overflow-x-auto">
          <table className="hidden md:table w-full text-left border-collapse">
            <thead>
            <tr className="border-b border-surface-variant bg-surface-container-low">
              <th className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                {t('common.name')}
              </th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                Kontakt
              </th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                {t('staff.role')}
              </th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                {t('staff.specializations')}
              </th>
              <th className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-right whitespace-nowrap">
                Akcje
              </th>
            </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
            {staffMembers.map((member) => (
              <tr
                key={member.id}
                className="hover:bg-surface-container-low transition-colors group"
              >
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-label-bold text-label-bold shrink-0">
                      {getInitials(member.firstName, member.lastName)}
                    </div>
                    <div className="font-body-md text-body-md text-on-surface font-semibold">
                      {member.firstName} {member.lastName}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">mail</span>
                      {member.email}
                    </div>
                    <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">call</span>
                      {formatPhone(member.phone)}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <RoleBadge role={member.role} />
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-wrap gap-2">
                    {member.specializations?.slice(0, MAX_SPECS_VISIBLE).map((s) => (
                      <span
                        key={s.id}
                        className="px-2 py-1 bg-surface border border-outline-variant rounded text-xs text-on-surface-variant"
                      >
                          {s.name}
                        </span>
                    ))}
                    {member.specializations &&
                      member.specializations.length > MAX_SPECS_VISIBLE && (
                        <button
                          type="button"
                          onClick={() => openSpecsModal(member)}
                          className="px-2 py-1 bg-surface border border-outline-variant rounded text-xs text-on-surface-variant hover:bg-surface-container-low"
                        >
                          +{member.specializations.length - MAX_SPECS_VISIBLE}
                        </button>
                      )}
                  </div>
                </td>
                <td className="py-4 px-6 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (actionsDropdownOpen === member.id) {
                        closeDropdown();
                      } else {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setDropdownPosition({ top: rect.bottom + 4, left: rect.right - 192 });
                        setActionsDropdownOpen(member.id);
                      }
                    }}
                    className="text-outline hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-variant inline-flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-surface-variant">
          {staffMembers.map((member) => (
            <div key={member.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-label-bold text-label-bold shrink-0">
                    {getInitials(member.firstName, member.lastName)}
                  </div>
                  <div>
                    <div className="font-body-md text-body-md text-on-surface font-semibold">
                      {member.firstName} {member.lastName}
                    </div>
                    <RoleBadge role={member.role} />
                  </div>
                </div>
                <button
                  onClick={() => setMobileActionsMember(member)}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-full text-outline hover:text-primary hover:bg-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
              <div className="space-y-2 ml-[52px]">
                <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">mail</span>
                  <span className="truncate">{member.email}</span>
                </div>
                <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  {formatPhone(member.phone)}
                </div>
                {member.specializations && member.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {member.specializations.slice(0, 2).map((s) => (
                      <span
                        key={s.id}
                        className="px-2 py-0.5 bg-surface border border-outline-variant rounded text-xs text-on-surface-variant"
                      >
                        {s.name}
                      </span>
                    ))}
                    {member.specializations.length > 2 && (
                      <button
                        type="button"
                        onClick={() => openSpecsModal(member)}
                        className="px-2 py-0.5 bg-surface border border-outline-variant rounded text-xs text-on-surface-variant hover:bg-surface-container-low"
                      >
                        +{member.specializations.length - 2}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
          pageSize={pagination.pageSize}
          onPageChange={handlePageChange}
          infoTemplate={`Pokazano {start}–{end} z {total}`}
        />
      </div>

      {/* ============ DESKTOP ACTIONS DROPDOWN (portal) ============ */}
      {actionsDropdownOpen &&
        dropdownPosition &&
        (() => {
          const member = staffMembers.find((m) => m.id === actionsDropdownOpen);
          if (!member) return null;
          return (
            <ModalPortal blockScroll={false}>
              <div className="fixed inset-0 z-[200]" onClick={closeDropdown}>
                <div
                  className="fixed w-48 rounded-xl border border-surface-variant bg-surface-container-lowest shadow-lg"
                  style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => openEditModal(member)}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors rounded-t-xl"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={() => openManageSpecsModal(member)}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">assignment</span>
                    {t('staff.manageSpecs')}
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member)}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-error hover:bg-error-container transition-colors rounded-b-xl"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            </ModalPortal>
          );
        })()}

      {/* ============ ROUTE MODAL LOADING ============ */}
      {routeModalWaitingForMember && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-surface-variant bg-surface-container-lowest p-8 shadow-lg">
              <div className="flex items-center justify-center gap-3 text-on-surface-variant">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
                {t('loading')}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ============ MOBILE BOTTOM SHEET FOR ACTIONS ============ */}
      {mobileActionsMember && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[9999] md:hidden"
            onClick={() => setMobileActionsMember(null)}
          >
            <div className="absolute inset-0 bg-black/50" />
            <div
              className="absolute bottom-0 left-0 right-0 bg-surface-container-lowest rounded-t-2xl border-t border-surface-variant shadow-lg animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-outline-variant rounded-full" />
              </div>
              <div className="px-6 pb-4 flex items-center gap-3 border-b border-surface-variant">
                <div className="h-10 w-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-label-bold text-label-bold shrink-0">
                  {getInitials(mobileActionsMember.firstName, mobileActionsMember.lastName)}
                </div>
                <div>
                  <div className="font-body-md text-body-md text-on-surface font-semibold">
                    {mobileActionsMember.firstName} {mobileActionsMember.lastName}
                  </div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">
                    {mobileActionsMember.email}
                  </div>
                </div>
              </div>
              <div className="py-2">
                <button
                  onClick={() => openEditModal(mobileActionsMember)}
                  className="flex w-full items-center gap-4 px-6 py-3.5 text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px]">edit</span>
                  <span className="font-body-md text-body-md">{t('common.edit')}</span>
                </button>
                <button
                  onClick={() => openManageSpecsModal(mobileActionsMember)}
                  className="flex w-full items-center gap-4 px-6 py-3.5 text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px]">assignment</span>
                  <span className="font-body-md text-body-md">{t('staff.manageSpecs')}</span>
                </button>
                <button
                  onClick={() => handleDeleteMember(mobileActionsMember)}
                  className="flex w-full items-center gap-4 px-6 py-3.5 text-error hover:bg-error-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px]">delete</span>
                  <span className="font-body-md text-body-md">{t('common.delete')}</span>
                </button>
              </div>
              <div className="px-4 pb-4 pt-2 border-t border-surface-variant">
                <button
                  onClick={() => setMobileActionsMember(null)}
                  className="w-full py-3 rounded-xl bg-surface-container-low text-on-surface font-label-bold text-label-bold hover:bg-surface-container transition-colors"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ============ SPEC VIEW MODAL ============ */}
      {specModalMember && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-surface-variant bg-surface-container-lowest p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-h3 text-h3 text-on-surface">
                  {t('staff.specializationsFor', {
                    name: `${specModalMember.firstName} ${specModalMember.lastName}`,
                  })}
                </h3>
                <button onClick={closeModal} className={closeBtnClass}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {specModalMember.specializations?.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3"
                  >
                    <span className="font-body-md text-body-md text-on-surface">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ============ MANAGE SPECS MODAL ============ */}
      {manageSpecsMember && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-surface-variant bg-surface-container-lowest p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-h3 text-h3 text-on-surface">
                  {t('staff.specializationsFor', {
                    name: `${manageSpecsMember.firstName} ${manageSpecsMember.lastName}`,
                  })}
                </h3>
                <button onClick={closeModal} className={closeBtnClass}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {manageSpecsMember.specializations?.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3"
                    >
                      <span className="font-body-md text-body-md text-on-surface">{s.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecialization(manageSpecsMember.id, s.id)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-full text-error hover:bg-error-container transition-colors"
                      >
                        <IconClose className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 pt-4 border-t border-surface-variant">
                  <Select
                    options={availableSpecOptions}
                    value={addSpecId}
                    onChange={(v) => setAddSpecId(String(v))}
                    placeholder={t('staff.selectSpecialization')}
                  />
                  <button
                    type="button"
                    onClick={handleAddSpecialization}
                    disabled={!addSpecId || addingSpec}
                    className="w-full bg-primary hover:bg-primary-hover text-on-primary font-label-bold text-label-bold py-3 px-6 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingSpec ? '…' : t('staff.addSpecialization')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ============ ADD/EDIT FORM MODAL ============ */}
      {showForm && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-surface-variant bg-surface-container-lowest p-6 shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-h3 text-h3 text-on-surface">
                  {editingMember ? t('staff.edit') : t('staff.new')}
                </h3>
                <button onClick={resetForm} className={closeBtnClass}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block font-body-md text-body-md text-on-surface-variant">
                      {t('common.firstName')} *
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder={t('common.firstName')}
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      maxLength={40}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-body-md text-body-md text-on-surface-variant">
                      {t('common.lastName')} *
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder={t('common.lastName')}
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      maxLength={40}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block font-body-md text-body-md text-on-surface-variant">
                      {t('common.email')} *
                    </label>
                    <input
                      type="email"
                      className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder={t('common.email')}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-body-md text-body-md text-on-surface-variant">
                      {t('common.phone')} *
                    </label>
                    <input
                      type="tel"
                      className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder={t('common.phone')}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block font-body-md text-body-md text-on-surface-variant">
                      {t('common.password')} {!editingMember && '*'}
                    </label>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder={
                        editingMember ? t('staff.passwordHint') : t('common.password')
                      }
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingMember}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-body-md text-body-md text-on-surface-variant">
                      {t('staff.role')} *
                    </label>
                    <Select
                      options={roleOptions}
                      value={formData.role}
                      onChange={(v) => setFormData({ ...formData, role: Number(v) })}
                      placeholder={t('staff.role')}
                      dropUp
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary-hover text-on-primary font-label-bold text-label-bold py-3 px-6 rounded-lg shadow-sm transition-colors"
                  >
                    {editingMember ? t('common.update') : t('common.create')}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default StaffMemberList;