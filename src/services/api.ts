import axios, { type AxiosInstance } from 'axios';
import { API_BASE_URL, StaffRole, LOCAL_STORAGE_KEYS } from '../constants/constants';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config?.url?.includes('/api/Auth/');
    if (error.response?.status === 401 && !isAuthEndpoint) {
      Object.values(LOCAL_STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  eventTypeId?: string;
}

export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post<{ token: string }>('/api/Auth/login', credentials),
  register: (staffMemberData: Record<string, unknown>) =>
    apiClient.post('/api/Auth/register', staffMemberData),
};

export const companyApi = {
  create: (companyData: Record<string, unknown>) => apiClient.post('/api/Company', companyData),
  getById: (companyId: string) => apiClient.get(`/api/Company/${companyId}`),
  update: (companyId: string, companyData: Record<string, unknown>) =>
    apiClient.put(`/api/Company/${companyId}`, companyData),
  delete: (companyId: string) => apiClient.delete(`/api/Company/${companyId}`),
  markAsReception: (companyId: string) =>
    apiClient.patch(`/api/Company/${companyId}/markAsReception`),
  unmarkAsReception: (companyId: string) =>
    apiClient.patch(`/api/Company/${companyId}/unmarkAsReception`),
  addRelation: (companyId: string, relatedCompanyId: string) =>
    apiClient.post(`/api/Company/${companyId}/relation`, JSON.stringify(relatedCompanyId)),
  deleteRelation: (companyId: string) =>
    apiClient.delete(`/api/Company/${companyId}/relation`),
  getRelation: (companyId: string) => apiClient.get(`/api/Company/${companyId}/relation`),
  getBreakTimes: (companyId: string) =>
    apiClient.get<{ breakTimeStaff?: number; breakTimeParticipants?: number }>(`/api/Company/${companyId}/breakTimes`),
  updateBreakTimes: (companyId: string, breakTimesData: Record<string, unknown>) =>
    apiClient.put(`/api/Company/${companyId}/breakTimes`, breakTimesData),
};

export const eventScheduleApi = {
  getAll: (companyId: string, params: ListParams = {}) => {
    const queryParams: Record<string, number | string> = {};
    if (params.page !== undefined) queryParams.Page = params.page + 1;
    if (params.pageSize !== undefined) queryParams.PageSize = params.pageSize;
    if (params.search !== undefined && params.search.trim() !== '')
      queryParams.Search = params.search.trim();
    if (params.eventTypeId !== undefined && params.eventTypeId !== '')
      queryParams.EventTypeId = params.eventTypeId;
    return apiClient.get(`/api/EventSchedule/${companyId}`, { params: queryParams });
  },
  getById: (companyId: string, id: string) =>
    apiClient.get(`/api/EventSchedule/${companyId}/${id}`),
  create: (companyId: string, scheduleData: Record<string, unknown>) =>
    apiClient.post(`/api/EventSchedule/${companyId}`, scheduleData),
  update: (companyId: string, id: string, scheduleData: Record<string, unknown>) =>
    apiClient.put(`/api/EventSchedule/${companyId}/${id}`, scheduleData),
  delete: (companyId: string, id: string) =>
    apiClient.delete(`/api/EventSchedule/${companyId}/${id}`),
};

export const eventTypeApi = {
  getAll: (companyId: string, params: ListParams = {}) => {
    const queryParams: Record<string, number | string> = {};
    if (params.page !== undefined) queryParams.Page = params.page + 1;
    if (params.pageSize !== undefined) queryParams.PageSize = params.pageSize;
    if (params.search !== undefined && params.search.trim() !== '')
      queryParams.Search = params.search.trim();
    return apiClient.get(`/api/EventType/${companyId}`, { params: queryParams });
  },
  getById: (companyId: string, id: string) =>
    apiClient.get(`/api/EventType/${companyId}/${id}`),
  create: (companyId: string, eventTypeData: Record<string, unknown>) =>
    apiClient.post(`/api/EventType/${companyId}`, eventTypeData),
  update: (companyId: string, id: string, eventTypeData: Record<string, unknown>) =>
    apiClient.put(`/api/EventType/${companyId}/${id}`, eventTypeData),
  delete: (companyId: string, id: string) =>
    apiClient.delete(`/api/EventType/${companyId}/${id}`),
};

export const participantApi = {
  getAll: (companyId: string, params: ListParams = {}) => {
    const queryParams: Record<string, number | string> = {};
    if (params.page !== undefined) queryParams.Page = params.page + 1;
    if (params.pageSize !== undefined) queryParams.PageSize = params.pageSize;
    if (params.search !== undefined && params.search.trim() !== '')
      queryParams.Search = params.search.trim();
    return apiClient.get(`/api/Participant/${companyId}`, { params: queryParams });
  },
  getById: (companyId: string, participantId: string) =>
    apiClient.get(`/api/Participant/${companyId}/${participantId}`),
  create: (companyId: string, participantData: Record<string, unknown>) =>
    apiClient.post(`/api/Participant/${companyId}`, participantData),
  update: (companyId: string, participantId: string, participantData: Record<string, unknown>) =>
    apiClient.put(`/api/Participant/${companyId}/${participantId}`, participantData),
  delete: (companyId: string, participantId: string) =>
    apiClient.delete(`/api/Participant/${companyId}/${participantId}`),
};

export const reservationApi = {
  getAll: (companyId: string, params: ListParams = {}) => {
    const queryParams: Record<string, number | string> = {};
    if (params.page !== undefined) queryParams.Page = params.page + 1;
    if (params.pageSize !== undefined) queryParams.PageSize = params.pageSize;
    if (params.search !== undefined && params.search.trim() !== '')
      queryParams.Search = params.search.trim();
    return apiClient.get(`/api/Reservation/${companyId}`, { params: queryParams });
  },
  getById: (companyId: string, id: string) =>
    apiClient.get(`/api/Reservation/${companyId}/${id}`),
  create: (companyId: string, reservationData: Record<string, unknown>) =>
    apiClient.post(`/api/Reservation/${companyId}`, reservationData),
  update: (companyId: string, id: string, reservationData: Record<string, unknown>) =>
    apiClient.put(`/api/Reservation/${companyId}/${id}`, reservationData),
  delete: (companyId: string, id: string) =>
    apiClient.delete(`/api/Reservation/${companyId}/${id}`),
  markAsPaid: (companyId: string, id: string) =>
    apiClient.patch(`/api/Reservation/${companyId}/${id}/markAsPaid`),
  unmarkAsPaid: (companyId: string, id: string) =>
    apiClient.patch(`/api/Reservation/${companyId}/${id}/unmarkAsPaid`),
};

export const specializationApi = {
  getAll: (companyId: string, params: ListParams = {}) => {
    const queryParams: Record<string, number | string> = {};
    if (params.page !== undefined) queryParams.Page = params.page + 1;
    if (params.pageSize !== undefined) queryParams.PageSize = params.pageSize;
    if (params.search !== undefined && params.search.trim() !== '')
      queryParams.Search = params.search.trim();
    return apiClient.get(`/api/Specialization/${companyId}`, { params: queryParams });
  },
  getById: (companyId: string, id: string) =>
    apiClient.get(`/api/Specialization/${companyId}/${id}`),
  create: (companyId: string, specializationData: Record<string, unknown>) =>
    apiClient.post(`/api/Specialization/${companyId}`, specializationData),
  update: (companyId: string, id: string, specializationData: Record<string, unknown>) =>
    apiClient.put(`/api/Specialization/${companyId}/${id}`, specializationData),
  delete: (companyId: string, id: string) =>
    apiClient.delete(`/api/Specialization/${companyId}/${id}`),
};

export const staffMemberApi = {
  getAll: (companyId: string, params: ListParams = {}) => {
    const queryParams: Record<string, number | string> = {};
    if (params.page !== undefined) queryParams.Page = params.page + 1;
    if (params.pageSize !== undefined) queryParams.PageSize = params.pageSize;
    if (params.search !== undefined && params.search.trim() !== '')
      queryParams.Search = params.search.trim();
    return apiClient.get(`/api/StaffMember/${companyId}`, { params: queryParams });
  },
  getById: (companyId: string, staffMemberId: string) =>
    apiClient.get(`/api/StaffMember/${companyId}/${staffMemberId}`),
  create: (companyId: string, staffMemberData: Record<string, unknown>) =>
    apiClient.post(`/api/StaffMember/${companyId}`, staffMemberData),
  update: (companyId: string, staffMemberId: string, staffMemberData: Record<string, unknown>) =>
    apiClient.put(`/api/StaffMember/${companyId}/${staffMemberId}`, staffMemberData),
  delete: (companyId: string, staffMemberId: string) =>
    apiClient.delete(`/api/StaffMember/${companyId}/${staffMemberId}`),
  addSpecialization: (companyId: string, data: Record<string, unknown>) =>
    apiClient.post(`/api/StaffMember/${companyId}/specialization`, data),
  removeSpecialization: (companyId: string, staffMemberSpecializationId: string) =>
    apiClient.delete(
      `/api/StaffMember/${companyId}/specialization/${staffMemberSpecializationId}`
    ),
  getAvailability: (companyId: string, staffMemberId: string) =>
    apiClient.get(`/api/StaffMember/${companyId}/availability/${staffMemberId}`),
  addAvailability: (
    companyId: string,
    staffMemberId: string,
    availabilityData: Record<string, unknown>
  ) =>
    apiClient.post(
      `/api/StaffMember/${companyId}/availability/${staffMemberId}`,
      availabilityData
    ),
  removeAvailability: (companyId: string, availabilityId: string) =>
    apiClient.delete(`/api/StaffMember/${companyId}/availability/${availabilityId}`),
  getEventSchedules: (companyId: string, staffMemberId: string) =>
    apiClient.get(`/api/StaffMember/${companyId}/eventSchedules/${staffMemberId}`),
  assignToEventSchedule: (companyId: string, data: Record<string, unknown>) =>
    apiClient.post(`/api/StaffMember/${companyId}/eventSchedule`, data),
  removeFromEventSchedule: (companyId: string, eventScheduleStaffMemberId: string) =>
    apiClient.delete(
      `/api/StaffMember/${companyId}/eventSchedule/${eventScheduleStaffMemberId}`
    ),
};

export const staffMemberCompanyApi = {
  getCompanies: () =>
    apiClient.get<{ staffMember: Record<string, unknown>; companies: unknown[] }>(
      '/api/staffMember/companies'
    ),
  addToCompany: (companyId: string, staffMemberId: string, targetCompanyId: string) =>
    apiClient.post(`/api/staffMember/${companyId}/${staffMemberId}/companies/${targetCompanyId}`),
  removeFromCompany: (companyId: string, staffMemberId: string, targetCompanyId: string) =>
    apiClient.delete(`/api/staffMember/${companyId}/${staffMemberId}/companies/${targetCompanyId}`),
};

export { StaffRole };
