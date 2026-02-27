import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { eventTypeApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import ErrorModal from '../common/ErrorModal/ErrorModal';
import Pagination from '../common/Pagination/Pagination';
import { IconAdd, IconClose, IconEdit, IconTrash, IconCalendar } from '../common/Icons/Icons';

interface EventTypeItem {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  maxParticipants: number;
  minStaff: number;
}

const pageSize = 10;
const formInput =
  'w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 text-zinc-900 placeholder-zinc-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-primary-500 dark:focus:ring-primary-500/20';

const EventTypeList = () => {
  const { t } = useI18n();
  const { selectedCompany, isTrainer } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [eventTypes, setEventTypes] = useState<EventTypeItem[]>([]);
  const [pagination, setPagination] = useState({ page: 0, pageSize, totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<EventTypeItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 60,
    price: 0,
    maxParticipants: 11,
    minStaff: 1,
  });

  const currentPage = Math.max(0, parseInt(searchParams.get('page') || '1', 10) - 1);
  const companyId = selectedCompany?.id;

  const fetchEventTypes = useCallback(async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await eventTypeApi.getAll(companyId, { page: currentPage, pageSize });
      const data = response.data as { items?: EventTypeItem[]; page?: number; pageSize?: number; totalCount?: number; totalPages?: number };
      setEventTypes(data.items || []);
      setPagination({
        page: (data.page || 1) - 1,
        pageSize: data.pageSize || pageSize,
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.response?.data ?? e.message);
      setEventTypes([]);
      setPagination({ page: 0, pageSize, totalCount: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [companyId, currentPage]);

  const refreshEventTypes = async () => {
    if (!companyId) return;
    try {
      const response = await eventTypeApi.getAll(companyId, { page: currentPage, pageSize });
      const data = response.data as { items?: EventTypeItem[]; page?: number; pageSize?: number; totalCount?: number; totalPages?: number };
      setEventTypes(data.items || []);
      setPagination({
        page: (data.page || 1) - 1,
        pageSize: data.pageSize || pageSize,
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
      });
    } catch (_) {}
  };

  useEffect(() => {
    if (companyId) fetchEventTypes();
  }, [fetchEventTypes, companyId]);

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
        name: formData.name,
        description: formData.description,
        duration: Number(formData.duration),
        price: Number(formData.price),
        maxParticipants: Number(formData.maxParticipants),
        minStaff: Number(formData.minStaff),
      };
      if (editingType) await eventTypeApi.update(companyId, editingType.id, payload);
      else await eventTypeApi.create(companyId, payload);
      await refreshEventTypes();
      resetForm();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.response?.data ?? e.message);
    }
  };

  const handleDelete = async (typeId: string) => {
    if (!companyId || !window.confirm(t('eventTypes.deleteConfirm'))) return;
    try {
      await eventTypeApi.delete(companyId, typeId);
      await refreshEventTypes();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.message);
    }
  };

  const handleEdit = (type: EventTypeItem) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      duration: type.duration,
      price: type.price,
      maxParticipants: type.maxParticipants,
      minStaff: type.minStaff,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', duration: 60, price: 0, maxParticipants: 10, minStaff: 1 });
    setEditingType(null);
    setShowForm(false);
  };

  if (loading && eventTypes.length === 0) {
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
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('eventTypes.title')}</h3>
          {pagination.totalCount > 0 && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {pagination.totalCount === 1 ? t('eventTypes.typeCount', { count: pagination.totalCount }) : t('eventTypes.typesCount', { count: pagination.totalCount })}
            </span>
          )}
        </div>
        {!isTrainer() && (
          <button
            type="button"
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            {showForm ? (
              <>
                <IconClose className="w-4 h-4" />
                {t('common.cancel')}
              </>
            ) : (
              <>
                <IconAdd className="w-4 h-4" />
                {t('eventTypes.add')}
              </>
            )}
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
              {editingType ? t('eventTypes.edit') : t('eventTypes.new')}
            </h4>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t('common.name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={formInput}
                placeholder={t('common.name')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t('common.description')} <span className="text-red-500">*</span>
              </label>
              <textarea
                className={`${formInput} min-h-[80px]`}
                placeholder={t('common.description')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t('eventTypes.duration')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className={formInput}
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                  min={1}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t('eventTypes.price')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className={formInput}
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  min={0}
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t('eventTypes.maxParticipants')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className={formInput}
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                  min={1}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t('eventTypes.minStaff')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className={formInput}
                  value={formData.minStaff}
                  onChange={(e) => setFormData({ ...formData, minStaff: Number(e.target.value) })}
                  min={1}
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-xl border border-primary-300 bg-primary-500/15 px-4 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-500/25 dark:border-primary-600 dark:bg-primary-500/20 dark:text-primary-200 dark:hover:bg-primary-500/30 transition-colors"
              >
                {editingType ? t('common.update') : t('common.create')}
              </button>
              <button type="button" onClick={resetForm} className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <>
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-soft dark:shadow-soft-dark">
            {eventTypes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                      <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">{t('common.name')}</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">{t('common.description')}</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">{t('eventTypes.duration')}</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">{t('eventTypes.price')}</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">{t('eventTypes.maxParticipants')}</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">{t('eventTypes.minStaff')}</th>
                      {!isTrainer() && <th className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">—</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {eventTypes.map((type) => (
                      <tr key={type.id} className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{type.name}</td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-zinc-600 dark:text-zinc-400" title={type.description}>{type.description}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{type.duration} min</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">${Number(type.price).toFixed(2)}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{type.maxParticipants}</td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{type.minStaff}</td>
                        {!isTrainer() && (
                          <td className="px-4 py-3 text-right">
                            <button type="button" onClick={() => handleEdit(type)} className="mr-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
                              <IconEdit className="w-4 h-4" /> {t('common.edit')}
                            </button>
                            <button type="button" onClick={() => handleDelete(type.id)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                              <IconTrash className="w-4 h-4" /> {t('common.delete')}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 h-12 w-12 text-primary-400 dark:text-primary-500">
                  <IconCalendar className="h-full w-full" />
                </div>
                <h4 className="font-medium text-zinc-900 dark:text-zinc-100">{t('eventTypes.noTypes')}</h4>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('eventTypes.noTypesHint')}</p>
                {!isTrainer() && (
                  <button type="button" onClick={() => setShowForm(true)} className="mt-3 flex items-center gap-2 rounded-xl border border-primary-300 bg-primary-500/15 px-4 py-2.5 text-sm font-medium text-primary-700 dark:border-primary-600 dark:bg-primary-500/20 dark:text-primary-200">
                    <IconAdd className="w-4 h-4" />
                    {t('eventTypes.addFirst')}
                  </button>
                )}
              </div>
            )}
          </div>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalCount={pagination.totalCount}
            pageSize={pagination.pageSize}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default EventTypeList;
