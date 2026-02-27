import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { specializationApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import ErrorModal from '../common/ErrorModal/ErrorModal';
import SearchBar from '../common/SearchBar/SearchBar';
import Pagination from '../common/Pagination/Pagination';
import { IconAdd, IconClose, IconEdit, IconTrash, IconStar } from '../common/Icons/Icons';

interface SpecItem {
  id: string;
  name: string;
  description?: string;
}

const pageSize = 15;
const formInput =
  'w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 text-zinc-900 placeholder-zinc-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-primary-500 dark:focus:ring-primary-500/20';

const SpecializationList = () => {
  const { t } = useI18n();
  const { selectedCompany, isTrainer } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [specializations, setSpecializations] = useState<SpecItem[]>([]);
  const [pagination, setPagination] = useState({ page: 0, pageSize, totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSpec, setEditingSpec] = useState<SpecItem | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const searchQuery = searchParams.get('search') || '';
  const currentPage = Math.max(0, parseInt(searchParams.get('page') || '1', 10) - 1);
  const companyId = selectedCompany?.id;

  const fetchSpecializations = useCallback(async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await specializationApi.getAll(companyId, { page: currentPage, pageSize, search: searchQuery });
      const data = response.data as { items?: SpecItem[]; page?: number; pageSize?: number; totalCount?: number; totalPages?: number };
      setSpecializations(data.items || []);
      setPagination({
        page: (data.page || 1) - 1,
        pageSize: data.pageSize || pageSize,
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.response?.data ?? e.message);
      setSpecializations([]);
      setPagination({ page: 0, pageSize, totalCount: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [companyId, currentPage, searchQuery]);

  useEffect(() => {
    if (companyId) fetchSpecializations();
  }, [fetchSpecializations, companyId]);

  const refreshSpecializations = async () => {
    if (!companyId) return;
    try {
      const response = await specializationApi.getAll(companyId, { page: currentPage, pageSize, search: searchQuery });
      const data = response.data as { items?: SpecItem[]; page?: number; pageSize?: number; totalCount?: number; totalPages?: number };
      setSpecializations(data.items || []);
      setPagination({
        page: (data.page || 1) - 1,
        pageSize: data.pageSize || pageSize,
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (_) {}
  };

  const handleSearchChange = (value: string) => {
    const next = new URLSearchParams();
    if (value) next.set('search', value);
    setSearchParams(next, { replace: false });
  };
  const handleSearchClear = () => setSearchParams({}, { replace: false });
  const handlePageChange = (newPage: number) => {
    const next = new URLSearchParams();
    if (searchQuery) next.set('search', searchQuery);
    if (newPage > 0) next.set('page', String(newPage + 1));
    setSearchParams(next, { replace: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    try {
      const payload = { name: formData.name, description: formData.description };
      if (editingSpec) await specializationApi.update(companyId, editingSpec.id, payload);
      else await specializationApi.create(companyId, payload);
      await refreshSpecializations();
      resetForm();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.response?.data ?? e.message);
    }
  };

  const handleDelete = async (specId: string) => {
    if (!companyId || !window.confirm(t('specializations.deleteConfirm'))) return;
    try {
      await specializationApi.delete(companyId, specId);
      await refreshSpecializations();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.message);
    }
  };

  const handleEdit = (spec: SpecItem) => {
    setEditingSpec(spec);
    setFormData({ name: spec.name, description: spec.description || '' });
    setShowForm(true);
  };
  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingSpec(null);
    setShowForm(false);
  };

  if (loading && specializations.length === 0) {
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('specializations.title')}</h3>
          {pagination.totalCount > 0 && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {pagination.totalCount === 1 ? t('specializations.specCount', { count: pagination.totalCount }) : t('specializations.specsCount', { count: pagination.totalCount })}
              {searchQuery && t('common.found')}
            </span>
          )}
        </div>
        {!isTrainer() && (
          <button
            type="button"
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            {showForm ? <><IconClose className="w-4 h-4" /> {t('common.cancel')}</> : <><IconAdd className="w-4 h-4" /> {t('specializations.add')}</>}
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
              {editingSpec ? t('specializations.edit') : t('specializations.new')}
            </h4>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('common.name')} *</label>
              <input type="text" className={formInput} placeholder={t('common.name')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('common.description')} *</label>
              <textarea className={`${formInput} min-h-[80px]`} placeholder={t('common.description')} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="rounded-xl border border-primary-300 bg-primary-500/15 px-4 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-500/25 dark:border-primary-600 dark:bg-primary-500/20 dark:text-primary-200 dark:hover:bg-primary-500/30 transition-colors">{editingSpec ? t('common.update') : t('common.create')}</button>
              <button type="button" onClick={resetForm} className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors">{t('common.cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <>
          <SearchBar value={searchQuery} onChange={handleSearchChange} onClear={handleSearchClear} loading={loading} resultCount={searchQuery ? pagination.totalCount : null} />
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
            {specializations.length > 0 ? (
              <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {specializations.map((spec) => (
                  <div key={spec.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-300">
                        <IconStar className="h-4 w-4" />
                      </div>
                      {!isTrainer() && (
                        <div className="flex gap-1">
                          <button type="button" onClick={() => handleEdit(spec)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-300" title={t('common.edit')}>
                            <IconEdit className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => handleDelete(spec.id)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400" title={t('common.delete')}>
                            <IconTrash className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <h4 className="mt-2 font-medium text-zinc-900 dark:text-zinc-100">{spec.name}</h4>
                    <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{spec.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 h-12 w-12 text-primary-400 dark:text-primary-500">
                  <IconStar className="h-full w-full" />
                </div>
                {searchQuery ? (
                  <>
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-100">{t('specializations.noResults')}</h4>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('specializations.noResultsHint', { query: searchQuery })}</p>
                    <button type="button" onClick={handleSearchClear} className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-800">{t('common.clearSearch')}</button>
                  </>
                ) : (
                  <>
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-100">{t('specializations.noSpecs')}</h4>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('specializations.noSpecsHint')}</p>
                    {!isTrainer() && (
                      <button type="button" onClick={() => setShowForm(true)} className="mt-3 flex items-center gap-2 rounded-xl border border-primary-300 bg-primary-500/15 px-4 py-2.5 text-sm font-medium text-primary-700 dark:border-primary-600 dark:bg-primary-500/20 dark:text-primary-200">
                        <IconAdd className="w-4 h-4" /> {t('specializations.addFirst')}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} totalCount={pagination.totalCount} pageSize={pagination.pageSize} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  );
};

export default SpecializationList;
