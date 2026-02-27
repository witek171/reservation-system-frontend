import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { participantApi } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useI18n } from '../context/I18nContext.tsx';
import ErrorModal from './common/ErrorModal.tsx';
import SearchBar from './common/SearchBar.tsx';
import Pagination from './common/Pagination.tsx';
import { IconAdd, IconClose, IconEdit, IconTrash, IconUsers } from './common/Icons.tsx';

interface ParticipantItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  createdAt?: string;
}

const pageSize = 10;
const formInput =
  'w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 text-zinc-900 placeholder-zinc-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-primary-500 dark:focus:ring-primary-500/20';

const ParticipantList = () => {
  const { t } = useI18n();
  const { selectedCompany, isTrainer } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [pagination, setPagination] = useState({ page: 0, pageSize, totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<ParticipantItem | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gdprConsent: false,
  });

  const searchQuery = searchParams.get('search') || '';
  const currentPage = Math.max(0, parseInt(searchParams.get('page') || '1', 10) - 1);
  const companyId = selectedCompany?.id;

  const fetchParticipants = useCallback(async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await participantApi.getAll(companyId, { page: currentPage, pageSize, search: searchQuery });
      const data = response.data as { items?: ParticipantItem[]; page?: number; pageSize?: number; totalCount?: number; totalPages?: number };
      setParticipants(data.items || []);
      setPagination({
        page: (data.page || 1) - 1,
        pageSize: data.pageSize || pageSize,
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.response?.data ?? e.message);
      setParticipants([]);
      setPagination({ page: 0, pageSize, totalCount: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [companyId, currentPage, searchQuery]);

  useEffect(() => {
    if (companyId) fetchParticipants();
  }, [fetchParticipants, companyId]);

  const refreshParticipants = async () => {
    if (!companyId) return;
    try {
      const response = await participantApi.getAll(companyId, { page: currentPage, pageSize, search: searchQuery });
      const data = response.data as { items?: ParticipantItem[]; page?: number; pageSize?: number; totalCount?: number; totalPages?: number };
      setParticipants(data.items || []);
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
      const payload = { firstName: formData.firstName, lastName: formData.lastName, email: formData.email, phone: formData.phone };
      if (editingParticipant) {
        await participantApi.update(companyId, editingParticipant.id, payload);
      } else {
        await participantApi.create(companyId, { ...payload, gdprConsent: formData.gdprConsent });
      }
      await refreshParticipants();
      resetForm();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.response?.data ?? e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!companyId || !window.confirm(t('participants.deleteConfirm'))) return;
    try {
      await participantApi.delete(companyId, id);
      await refreshParticipants();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.message);
    }
  };

  const handleEdit = (p: ParticipantItem) => {
    setEditingParticipant(p);
    setFormData({
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      phone: p.phone || '',
      gdprConsent: true,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', phone: '', gdprConsent: false });
    setEditingParticipant(null);
    setShowForm(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return { date: '-', time: '' };
    const d = new Date(dateString);
    return {
      date: d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const getInitials = (first?: string, last?: string) =>
    `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();

  if (loading && participants.length === 0) {
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
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('participants.title')}</h3>
          {pagination.totalCount > 0 && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {pagination.totalCount === 1 ? t('participants.personCount', { count: pagination.totalCount }) : t('participants.peopleCount', { count: pagination.totalCount })}
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
            {showForm ? <><IconClose className="w-4 h-4" /> {t('common.cancel')}</> : <><IconAdd className="w-4 h-4" /> {t('participants.add')}</>}
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
              {editingParticipant ? t('participants.edit') : t('participants.new')}
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
            {!editingParticipant && (
              <label className="flex items-start gap-2">
                <input type="checkbox" checked={formData.gdprConsent} onChange={(e) => setFormData({ ...formData, gdprConsent: e.target.checked })} required className="mt-1 rounded border-zinc-300" />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{t('participants.gdprConsent')} *</span>
              </label>
            )}
            <div className="flex gap-2">
              <button type="submit" className="rounded-xl border border-primary-300 bg-primary-500/15 px-4 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-500/25 dark:border-primary-600 dark:bg-primary-500/20 dark:text-primary-200 dark:hover:bg-primary-500/30 transition-colors">{editingParticipant ? t('common.update') : t('common.create')}</button>
              <button type="button" onClick={resetForm} className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors">{t('common.cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <>
          <SearchBar value={searchQuery} onChange={handleSearchChange} onClear={handleSearchClear} loading={loading} resultCount={searchQuery ? pagination.totalCount : null} />
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
            {participants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                      <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">{t('common.name')}</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">{t('common.email')}</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">{t('common.phone')}</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">{t('participants.created')}</th>
                      {!isTrainer() && <th className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">—</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p) => {
                      const { date, time } = formatDate(p.createdAt);
                      return (
                        <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                                {getInitials(p.firstName, p.lastName)}
                              </div>
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">{p.firstName} {p.lastName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{p.email}</td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{p.phone || '-'}</td>
                          <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{date} {time}</td>
                          {!isTrainer() && (
                            <td className="px-4 py-3 text-right">
                              <button type="button" onClick={() => handleEdit(p)} className="mr-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
                                <IconEdit className="w-4 h-4" /> {t('common.edit')}
                              </button>
                              <button type="button" onClick={() => handleDelete(p.id)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                                <IconTrash className="w-4 h-4" /> {t('common.delete')}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 h-12 w-12 text-primary-400 dark:text-primary-500">
                  <IconUsers className="h-full w-full" />
                </div>
                {searchQuery ? (
                  <>
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-100">{t('participants.noResults')}</h4>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('participants.noResultsHint', { query: searchQuery })}</p>
                    <button type="button" onClick={handleSearchClear} className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-800">{t('common.clearSearch')}</button>
                  </>
                ) : (
                  <>
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-100">{t('participants.noParticipants')}</h4>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('participants.noParticipantsHint')}</p>
                    {!isTrainer() && (
                      <button type="button" onClick={() => setShowForm(true)} className="mt-3 flex items-center gap-2 rounded-xl border border-primary-300 bg-primary-500/15 px-4 py-2.5 text-sm font-medium text-primary-700 dark:border-primary-600 dark:bg-primary-500/20 dark:text-primary-200">
                        <IconAdd className="w-4 h-4" /> {t('participants.addFirst')}
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

export default ParticipantList;
