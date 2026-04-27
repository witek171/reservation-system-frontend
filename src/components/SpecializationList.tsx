import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { specializationApi } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../context/I18nContext.tsx';
import ErrorModal from './common/ErrorModal.tsx';
import ModalPortal from './common/ModalPortal.tsx';
import Pagination from './common/Pagination.tsx';
import SearchBar from './common/SearchBar.tsx';

interface SpecItem {
  id: string;
  name: string;
  description?: string;
}

const createInitialFormData = () => ({
  name: '',
  description: '',
});

const pageSize = 10;

const SpecializationList = () => {
  const { t } = useI18n();
  const { selectedCompany, isTrainer } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [specializations, setSpecializations] = useState<SpecItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | { message?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const [actionsDropdownOpen, setActionsDropdownOpen] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(
    null
  );
  const [mobileActionsSpec, setMobileActionsSpec] = useState<SpecItem | null>(null);
  const [modalSpec, setModalSpec] = useState<SpecItem | null>(null);
  const [formData, setFormData] = useState(createInitialFormData());

  const listTopRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToTopRef = useRef(false);

  const currentPage = Math.max(0, parseInt(searchParams.get('page') || '1', 10) - 1);
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize,
    totalCount: 0,
    totalPages: 1,
  });

  const companyId = selectedCompany?.id;

  // --- URL-driven modal state ---
  const modalMode = searchParams.get('modal');
  const modalId = searchParams.get('id');

  const showForm = modalMode === 'create' || (modalMode === 'edit' && !!modalSpec);
  const editingSpec = modalMode === 'edit' ? modalSpec : null;

  // --- Helpers ---
  const applySpecToForm = useCallback((spec: SpecItem) => {
    setFormData({
      name: spec.name,
      description: spec.description || '',
    });
  }, []);

  const closeDropdown = useCallback(() => {
    setActionsDropdownOpen(null);
    setDropdownPosition(null);
  }, []);

  const openCreateModal = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    params.set('modal', 'create');
    params.delete('id');
    setSearchParams(params, { replace: false });
    setModalSpec(null);
    setFormData(createInitialFormData());
    closeDropdown();
  }, [searchParams, setSearchParams, closeDropdown]);

  const openEditModal = useCallback(
    (spec: SpecItem) => {
      const params = new URLSearchParams(searchParams);
      params.set('modal', 'edit');
      params.set('id', spec.id);
      setModalSpec(spec);
      applySpecToForm(spec);
      closeDropdown();
      setMobileActionsSpec(null);
      setSearchParams(params, { replace: false });
    },
    [searchParams, setSearchParams, applySpecToForm, closeDropdown]
  );

  const closeModal = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    params.delete('modal');
    params.delete('id');
    setModalSpec(null);
    setFormData(createInitialFormData());
    closeDropdown();
    setMobileActionsSpec(null);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams, closeDropdown]);

  const resetForm = () => closeModal();

  // --- Sync URL modal → modalSpec state ---
  useEffect(() => {
    if (!companyId) return;

    if (modalMode === 'create') {
      setModalSpec(null);
      setFormData(createInitialFormData());
      return;
    }

    if (modalMode !== 'edit') {
      setModalSpec(null);
      return;
    }

    if (!modalId) return;

    const fromList = specializations.find((spec) => spec.id === modalId);
    if (fromList) {
      setModalSpec(fromList);
      applySpecToForm(fromList);
    }
  }, [companyId, modalMode, modalId, specializations, applySpecToForm]);

  // --- Fetch ---
  const fetchSpecializations = useCallback(async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      setError(null);

      const params: Record<string, unknown> = {
        page: currentPage,
        pageSize,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await specializationApi.getAll(companyId, params);
      const data = response.data as {
        items?: SpecItem[];
        page?: number;
        pageSize?: number;
        totalCount?: number;
        totalPages?: number;
      };

      setSpecializations(data.items || []);
      setPagination({
        page: currentPage,
        pageSize: data.pageSize || pageSize,
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } | string }; message?: string };
      setError(
        (typeof e.response?.data === 'object' && e.response?.data?.message) ||
        (typeof e.response?.data === 'string' ? e.response.data : null) ||
        e.message ||
        null
      );
      setSpecializations([]);
      setPagination({ page: 0, pageSize, totalCount: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [companyId, searchQuery, currentPage]);

  useEffect(() => {
    if (companyId) fetchSpecializations();
  }, [fetchSpecializations, companyId]);

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

  // --- Refresh ---
  const refreshSpecializations = async () => {
    if (!companyId) return;

    try {
      const params: Record<string, unknown> = {
        page: currentPage,
        pageSize,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await specializationApi.getAll(companyId, params);
      const data = response.data as {
        items?: SpecItem[];
        page?: number;
        pageSize?: number;
        totalCount?: number;
        totalPages?: number;
      };

      setSpecializations(data.items || []);
      setPagination({
        page: currentPage,
        pageSize: data.pageSize || pageSize,
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (_) {}
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
      };

      if (editingSpec) {
        await specializationApi.update(companyId, editingSpec.id, payload);
      } else {
        await specializationApi.create(companyId, payload);
      }

      await refreshSpecializations();
      resetForm();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } | string }; message?: string };
      setError(
        (typeof e.response?.data === 'object' && e.response?.data?.message) ||
        (typeof e.response?.data === 'string' ? e.response.data : null) ||
        e.message ||
        null
      );
    }
  };

  // --- Delete ---
  const handleDelete = async (spec: SpecItem) => {
    if (!companyId || !window.confirm(t('specializations.deleteConfirm'))) return;

    try {
      setError(null);
      await specializationApi.delete(companyId, spec.id);
      closeDropdown();
      setMobileActionsSpec(null);
      await refreshSpecializations();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } | string }; message?: string };
      setError(
        (typeof e.response?.data === 'object' && e.response?.data?.message) ||
        (typeof e.response?.data === 'string' ? e.response.data : null) ||
        e.message ||
        null
      );
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

  if (loading && specializations.length === 0) {
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

  return (
    <div className="space-y-6">
      {error && <ErrorModal error={error} onClose={() => setError(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-h2 text-h2 text-on-surface">{t('specializations.title')}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Zarządzaj specjalizacjami pracowników.
          </p>
        </div>

        {!isTrainer() && (
          <button
            type="button"
            onClick={openCreateModal}
            className="bg-secondary hover:bg-secondary-fixed-variant text-on-secondary font-label-bold text-label-bold py-3 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {t('specializations.add')}
          </button>
        )}
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
            placeholder="Szukaj specjalizacji..."
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
                {t('common.description')}
              </th>
              {!isTrainer() && (
                <th className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-right whitespace-nowrap">
                  Akcje
                </th>
              )}
            </tr>
            </thead>

            <tbody className="divide-y divide-surface-variant">
            {specializations.map((spec) => (
              <tr key={spec.id} className="hover:bg-surface-container-low transition-colors group">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">star</span>
                    </div>
                    <span className="font-body-md text-body-md text-on-surface font-semibold">
                        {spec.name}
                      </span>
                  </div>
                </td>

                <td className="py-4 px-6 max-w-[320px]">
                    <span
                      className="font-body-sm text-body-sm text-on-surface-variant truncate block"
                      title={spec.description}
                    >
                      {spec.description || '—'}
                    </span>
                </td>

                {!isTrainer() && (
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();

                        if (actionsDropdownOpen === spec.id) {
                          closeDropdown();
                        } else {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setDropdownPosition({
                            top: rect.bottom + 4,
                            left: rect.right - 192,
                          });
                          setActionsDropdownOpen(spec.id);
                        }
                      }}
                      className="text-outline hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-variant inline-flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </td>
                )}
              </tr>
            ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-surface-variant">
          {specializations.map((spec) => (
            <div key={spec.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">star</span>
                  </div>
                  <div>
                    <div className="font-body-md text-body-md text-on-surface font-semibold">
                      {spec.name}
                    </div>
                  </div>
                </div>

                {!isTrainer() && (
                  <button
                    onClick={() => setMobileActionsSpec(spec)}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-full text-outline hover:text-primary hover:bg-surface-variant transition-colors"
                  >
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                )}
              </div>

              <div className="ml-[52px]">
                <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] mt-0.5">notes</span>
                  <span>{spec.description || '—'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {!loading && specializations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <span className="material-symbols-outlined text-[48px] text-outline mb-4">star</span>

            {searchQuery ? (
              <>
                <h4 className="font-body-md text-body-md font-semibold text-on-surface">
                  {t('specializations.noResults')}
                </h4>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  {t('specializations.noResultsHint', { query: searchQuery })}
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface font-label-bold text-label-bold hover:bg-surface-container-low transition-colors"
                >
                  {t('common.clearSearch')}
                </button>
              </>
            ) : (
              <>
                <h4 className="font-body-md text-body-md font-semibold text-on-surface">
                  {t('specializations.noSpecs')}
                </h4>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  {t('specializations.noSpecsHint')}
                </p>
                {!isTrainer() && (
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="mt-4 bg-secondary hover:bg-secondary-fixed-variant text-on-secondary font-label-bold text-label-bold py-2.5 px-5 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    {t('specializations.addFirst')}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
          pageSize={pagination.pageSize}
          onPageChange={handlePageChange}
          infoTemplate="Pokazano {start}–{end} z {total}"
        />
      </div>

      {/* ============ DESKTOP ACTIONS DROPDOWN ============ */}
      {actionsDropdownOpen && dropdownPosition && (() => {
        const spec = specializations.find((item) => item.id === actionsDropdownOpen);
        if (!spec) return null;

        return (
          <ModalPortal blockScroll={false}>
            <div className="fixed inset-0 z-[200]" onClick={closeDropdown}>
              <div
                className="fixed w-48 rounded-xl border border-surface-variant bg-surface-container-lowest shadow-lg"
                style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => openEditModal(spec)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors rounded-t-xl"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  {t('common.edit')}
                </button>
                <button
                  onClick={() => handleDelete(spec)}
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

      {/* ============ MOBILE BOTTOM SHEET FOR ACTIONS ============ */}
      {mobileActionsSpec && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[9999] md:hidden"
            onClick={() => setMobileActionsSpec(null)}
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
                <div className="h-10 w-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">star</span>
                </div>
                <div>
                  <div className="font-body-md text-body-md text-on-surface font-semibold">
                    {mobileActionsSpec.name}
                  </div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">
                    {mobileActionsSpec.description || '—'}
                  </div>
                </div>
              </div>

              <div className="py-2">
                <button
                  onClick={() => openEditModal(mobileActionsSpec)}
                  className="flex w-full items-center gap-4 px-6 py-3.5 text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px]">edit</span>
                  <span className="font-body-md text-body-md">{t('common.edit')}</span>
                </button>
                <button
                  onClick={() => handleDelete(mobileActionsSpec)}
                  className="flex w-full items-center gap-4 px-6 py-3.5 text-error hover:bg-error-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px]">delete</span>
                  <span className="font-body-md text-body-md">{t('common.delete')}</span>
                </button>
              </div>

              <div className="px-4 pb-4 pt-2 border-t border-surface-variant">
                <button
                  onClick={() => setMobileActionsSpec(null)}
                  className="w-full py-3 rounded-xl bg-surface-container-low text-on-surface font-label-bold text-label-bold hover:bg-surface-container transition-colors"
                >
                  {t('common.cancel')}
                </button>
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
                  {editingSpec ? t('specializations.edit') : t('specializations.new')}
                </h3>
                <button onClick={resetForm} className={closeBtnClass}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="mb-2 block font-body-md text-body-md text-on-surface-variant">
                    {t('common.name')} *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder={t('common.name')}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="mb-2 block font-body-md text-body-md text-on-surface-variant">
                    {t('common.description')} *
                  </label>
                  <textarea
                    className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
                    placeholder={t('common.description')}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary-hover text-on-primary font-label-bold text-label-bold py-3 px-6 rounded-lg shadow-sm transition-colors"
                  >
                    {editingSpec ? t('common.update') : t('common.create')}
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

export default SpecializationList;