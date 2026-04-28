import {useState, useEffect, useCallback, useRef} from 'react';
import {useSearchParams} from 'react-router-dom';
import {eventTypeApi} from '../services/api.ts';
import {useAuth} from '../context/AuthContext.tsx';
import {useI18n} from '../context/I18nContext.tsx';
import ErrorModal from './common/ErrorModal.tsx';
import ModalPortal from './common/ModalPortal.tsx';
import Pagination from './common/Pagination.tsx';
import SearchBar from './common/SearchBar.tsx';

interface EventTypeItem {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  maxParticipants: number;
  minStaff: number;
}

const createInitialFormData = () => ({
  name: '',
  description: '',
  duration: 60,
  price: 0,
  maxParticipants: 10,
  minStaff: 1,
});

const pageSize = 10;

const EventTypeList = () => {
  const {t} = useI18n();
  const {selectedCompany, isTrainer} = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [eventTypes, setEventTypes] = useState<EventTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | { message?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const [actionsDropdownOpen, setActionsDropdownOpen] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [mobileActionsType, setMobileActionsType] = useState<EventTypeItem | null>(null);
  const [modalType, setModalType] = useState<EventTypeItem | null>(null);
  const [, setIsEditing] = useState(false);
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

  // --- Modal state from URL ---
  const urlModal = searchParams.get('modal');
  const urlId = searchParams.get('id');
  const showForm = urlModal === 'create' || (urlModal === 'edit' && !!modalType);
  const editingType = urlModal === 'edit' ? modalType : null;

  // --- Helpers ---
  const closeDropdown = useCallback(() => {
    setActionsDropdownOpen(null);
    setDropdownPosition(null);
  }, []);

  const applyTypeToForm = useCallback((et: EventTypeItem) => {
    setFormData({
      name: et.name,
      description: et.description || '',
      duration: et.duration,
      price: et.price,
      maxParticipants: et.maxParticipants,
      minStaff: et.minStaff,
    });
  }, []);

  const openCreateModal = useCallback(() => {
    setSearchParams({modal: 'create'}, {replace: false});
    setModalType(null);
    setFormData(createInitialFormData());
    setIsEditing(false);
    closeDropdown();
  }, [setSearchParams, closeDropdown]);

  const openEditModal = useCallback(
    (et: EventTypeItem) => {
      const params = new URLSearchParams(searchParams);
      params.set('modal', 'edit');
      params.set('id', et.id);
      setModalType(et);
      applyTypeToForm(et);
      setIsEditing(true);
      closeDropdown();
      setMobileActionsType(null);
      setSearchParams(params, {replace: false});
    },
    [searchParams, setSearchParams, applyTypeToForm, closeDropdown]
  );

  const closeModal = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    params.delete('modal');
    params.delete('id');
    setModalType(null);
    setFormData(createInitialFormData());
    setIsEditing(false);
    closeDropdown();
    setMobileActionsType(null);
    setSearchParams(params, {replace: true});
  }, [searchParams, setSearchParams, closeDropdown]);

  // --- Sync URL → modal state ---
  useEffect(() => {
    if (!companyId) return;
    if (urlModal === 'create') {
      setModalType(null);
      setFormData(createInitialFormData());
      setIsEditing(false);
      return;
    }
    if (urlModal !== 'edit') {
      setModalType(null);
      setIsEditing(false);
      return;
    }
    if (!urlId) return;
    const fromList = eventTypes.find((et) => et.id === urlId);
    if (fromList) {
      setModalType(fromList);
      applyTypeToForm(fromList);
      setIsEditing(true);
    }
  }, [companyId, urlModal, urlId, eventTypes, applyTypeToForm]);

  // --- Fetch ---
  const fetchEventTypes = useCallback(async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, unknown> = {page: currentPage, pageSize};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const response = await eventTypeApi.getAll(companyId, params);
      const data = response.data as {
        items?: EventTypeItem[];
        page?: number;
        pageSize?: number;
        totalCount?: number;
        totalPages?: number;
      };
      setEventTypes(data.items || []);
      setPagination({
        page: currentPage,
        pageSize: data.pageSize || pageSize,
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? (e.response?.data as string) ?? e.message ?? null);
      setEventTypes([]);
      setPagination({page: 0, pageSize, totalCount: 0, totalPages: 1});
    } finally {
      setLoading(false);
    }
  }, [companyId, searchQuery, currentPage]);

  useEffect(() => {
    if (companyId) fetchEventTypes();
  }, [fetchEventTypes, companyId]);

  // --- Scroll to top after page change ---
  useEffect(() => {
    if (!shouldScrollToTopRef.current || loading) return;
    shouldScrollToTopRef.current = false;
    requestAnimationFrame(() => {
      listTopRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
    });
  }, [loading, pagination.page]);

  // --- Sync search to URL ---
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      newParams.set('search', searchQuery.trim());
    } else {
      newParams.delete('search');
    }
    newParams.delete('page');
    setSearchParams(newParams, {replace: true});
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
    setSearchParams(newParams, {replace: false});
  };

  // --- Refresh ---
  const refreshEventTypes = async () => {
    if (!companyId) return;
    try {
      const params: Record<string, unknown> = {page: currentPage, pageSize};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const response = await eventTypeApi.getAll(companyId, params);
      const data = response.data as {
        items?: EventTypeItem[];
        page?: number;
        pageSize?: number;
        totalCount?: number;
        totalPages?: number;
      };
      setEventTypes(data.items || []);
      setPagination({
        page: currentPage,
        pageSize: data.pageSize || pageSize,
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (_) {
    }
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        duration: Number(formData.duration),
        price: Number(formData.price),
        maxParticipants: Number(formData.maxParticipants),
        minStaff: Number(formData.minStaff),
      };
      if (editingType) {
        await eventTypeApi.update(companyId, editingType.id, payload);
      } else {
        await eventTypeApi.create(companyId, payload);
      }
      await refreshEventTypes();
      closeModal();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? (e.response?.data as string) ?? e.message ?? null);
    }
  };

  // --- Delete ---
  const handleDelete = async (et: EventTypeItem) => {
    if (!companyId || !window.confirm(t('eventTypes.deleteConfirm'))) return;
    try {
      setError(null);
      await eventTypeApi.delete(companyId, et.id);
      closeDropdown();
      setMobileActionsType(null);
      await refreshEventTypes();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? (e.response?.data as string) ?? e.message ?? null);
    }
  };

  // --- Close dropdown on scroll/resize ---
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

  if (loading && eventTypes.length === 0) {
    return (
      <div className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-8">
        <div className="flex items-center justify-center gap-3 text-on-surface-variant">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-outline-variant border-t-primary"/>
          {t('loading')}
        </div>
      </div>
    );
  }

  const closeBtnClass =
    'h-9 w-9 inline-flex items-center justify-center rounded-full text-outline hover:text-on-surface hover:bg-surface-variant transition-colors';

  return (
    <div className="space-y-6">
      {error && <ErrorModal error={error} onClose={() => setError(null)}/>}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-h2 text-h2 text-on-surface">{t('eventTypes.title')}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Zarządzaj typami zajęć i ich parametrami.
          </p>
        </div>
        {!isTrainer() && (
          <button
            type="button"
            onClick={openCreateModal}
            className="bg-secondary hover:bg-secondary-fixed-variant text-on-secondary font-label-bold text-label-bold py-3 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {t('eventTypes.add')}
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
            placeholder="Szukaj typu zajęć..."
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
              <th
                className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                {t('common.name')}
              </th>
              <th
                className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                {t('common.description')}
              </th>
              <th
                className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                {t('eventTypes.duration')}
              </th>
              <th
                className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                {t('eventTypes.price')}
              </th>
              <th
                className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                {t('eventTypes.maxParticipants')}
              </th>
              <th
                className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
                {t('eventTypes.minStaff')}
              </th>
              {!isTrainer() && (
                <th
                  className="py-4 px-6 font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider text-right whitespace-nowrap">
                  Akcje
                </th>
              )}
            </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
            {eventTypes.map((et) => (
              <tr key={et.id} className="hover:bg-surface-container-low transition-colors group">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                    </div>
                    <span className="font-body-md text-body-md text-on-surface font-semibold">
                        {et.name}
                      </span>
                  </div>
                </td>
                <td className="py-4 px-6 max-w-[220px]">
                    <span
                      className="font-body-sm text-body-sm text-on-surface-variant block whitespace-normal break-words md:truncate"
                      title={et.description}
                    >
                      {et.description || '—'}
                    </span>
                </td>
                <td className="py-4 px-6">
                    <span className="font-body-sm text-body-sm text-on-surface">
                      {et.duration} min
                    </span>
                </td>
                <td className="py-4 px-6">
                    <span className="font-body-sm text-body-sm text-on-surface">
                      {Number(et.price).toFixed(2)}
                    </span>
                </td>
                <td className="py-4 px-6">
                    <span className="font-body-sm text-body-sm text-on-surface">
                      {et.maxParticipants}
                    </span>
                </td>
                <td className="py-4 px-6">
                    <span className="font-body-sm text-body-sm text-on-surface">
                      {et.minStaff}
                    </span>
                </td>
                {!isTrainer() && (
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (actionsDropdownOpen === et.id) {
                          closeDropdown();
                        } else {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setDropdownPosition({
                            top: rect.bottom + 4,
                            left: rect.right - 192,
                          });
                          setActionsDropdownOpen(et.id);
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
          {eventTypes.map((et) => (
            <div key={et.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                  </div>
                  <div>
                    <div className="font-body-md text-body-md text-on-surface font-semibold">
                      {et.name}
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant">
                      {et.duration} min · {Number(et.price).toFixed(2)} zł
                    </div>
                  </div>
                </div>
                {!isTrainer() && (
                  <button
                    onClick={() => setMobileActionsType(et)}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-full text-outline hover:text-primary hover:bg-surface-variant transition-colors"
                  >
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                )}
              </div>
              <div className="space-y-2 ml-[52px]">
                {et.description && (
                  <div className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface-variant min-w-0">
                    <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0">notes</span>
                    <span className="whitespace-normal break-words">
                      {et.description}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">group</span>
                  Maks. {et.maxParticipants} uczestników · Min. {et.minStaff} trener
                  {et.minStaff > 1 ? 'zy' : ''}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {!loading && eventTypes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <span className="material-symbols-outlined text-[48px] text-outline mb-4">
              calendar_today
            </span>
            {searchQuery ? (
              <>
                <h4 className="font-body-md text-body-md font-semibold text-on-surface">
                  {t('eventTypes.noResults')}
                </h4>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  {t('eventTypes.noResultsHint', {query: searchQuery})}
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
                  {t('eventTypes.noTypes')}
                </h4>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  {t('eventTypes.noTypesHint')}
                </p>
                {!isTrainer() && (
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="mt-4 bg-secondary hover:bg-secondary-fixed-variant text-on-secondary font-label-bold text-label-bold py-2.5 px-5 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    {t('eventTypes.addFirst')}
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

      {/* ============ DESKTOP ACTIONS DROPDOWN (portal) ============ */}
      {actionsDropdownOpen && dropdownPosition && (() => {
        const found = eventTypes.find((et) => et.id === actionsDropdownOpen);
        if (!found) return null;
        return (
          <ModalPortal blockScroll={false}>
            <div className="fixed inset-0 z-[200]" onClick={closeDropdown}>
              <div
                className="fixed w-48 rounded-xl border border-surface-variant bg-surface-container-lowest shadow-lg"
                style={{top: dropdownPosition.top, left: dropdownPosition.left}}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => openEditModal(found)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors rounded-t-xl"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  {t('common.edit')}
                </button>
                <button
                  onClick={() => handleDelete(found)}
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
      {mobileActionsType && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[9999] md:hidden"
            onClick={() => setMobileActionsType(null)}
          >
            <div className="absolute inset-0 bg-black/50"/>
            <div
              className="absolute bottom-0 left-0 right-0 bg-surface-container-lowest rounded-t-2xl border-t border-surface-variant shadow-lg animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-outline-variant rounded-full"/>
              </div>
              <div className="px-6 pb-4 flex items-center gap-3 border-b border-surface-variant">
                <div
                  className="h-10 w-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                </div>
                <div>
                  <div className="font-body-md text-body-md text-on-surface font-semibold">
                    {mobileActionsType.name}
                  </div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant">
                    {mobileActionsType.duration} min · {Number(mobileActionsType.price).toFixed(2)} zł
                  </div>
                </div>
              </div>
              <div className="py-2">
                <button
                  onClick={() => openEditModal(mobileActionsType)}
                  className="flex w-full items-center gap-4 px-6 py-3.5 text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px]">edit</span>
                  <span className="font-body-md text-body-md">{t('common.edit')}</span>
                </button>
                <button
                  onClick={() => handleDelete(mobileActionsType)}
                  className="flex w-full items-center gap-4 px-6 py-3.5 text-error hover:bg-error-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px]">delete</span>
                  <span className="font-body-md text-body-md">{t('common.delete')}</span>
                </button>
              </div>
              <div className="px-4 pb-4 pt-2 border-t border-surface-variant">
                <button
                  onClick={() => setMobileActionsType(null)}
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
            <div
              className="w-full max-w-lg rounded-2xl border border-surface-variant bg-surface-container-lowest p-6 shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-h3 text-h3 text-on-surface">
                  {editingType ? t('eventTypes.edit') : t('eventTypes.new')}
                </h3>
                <button onClick={closeModal} className={closeBtnClass}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="mb-2 block font-body-md text-body-md text-on-surface-variant">
                    {t('common.name')} *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder={t('common.name')}
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    maxLength={100}
                  />
                </div>
                {/* Description */}
                <div>
                  <label className="mb-2 block font-body-md text-body-md text-on-surface-variant">
                    {t('common.description')} *
                  </label>
                  <textarea
                    className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[80px]"
                    placeholder={t('common.description')}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                  />
                </div>
                {/* Duration + Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block font-body-md text-body-md text-on-surface-variant">
                      {t('eventTypes.duration')} *
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
                      min={1}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-body-md text-body-md text-on-surface-variant">
                      {t('eventTypes.price')} *
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                      min={0}
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                {/* MaxParticipants + MinStaff */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block font-body-md text-body-md text-on-surface-variant">
                      {t('eventTypes.maxParticipants')} *
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      value={formData.maxParticipants}
                      onChange={(e) =>
                        setFormData({...formData, maxParticipants: Number(e.target.value)})
                      }
                      min={1}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-body-md text-body-md text-on-surface-variant">
                      {t('eventTypes.minStaff')} *
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      value={formData.minStaff}
                      onChange={(e) =>
                        setFormData({...formData, minStaff: Number(e.target.value)})
                      }
                      min={1}
                      required
                    />
                  </div>
                </div>
                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary-hover text-on-primary font-label-bold text-label-bold py-3 px-6 rounded-lg shadow-sm transition-colors"
                  >
                    {editingType ? t('common.update') : t('common.create')}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
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

export default EventTypeList;