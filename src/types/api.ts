export type StaffRoleType = 0 | 1 | 2;

export interface User {
  id: string;
  email: string;
  [key: string]: unknown;
}

export interface Company {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface StaffMember {
  id: string;
  userId?: string;
  role?: string;
  [key: string]: unknown;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AvailabilitySlot {
  id?: string;
  staffMemberId?: string;
  startTime: string;
  endTime: string;
  dayOfWeek?: number;
  date?: string;
  [key: string]: unknown;
}

export interface EventSchedule {
  id: string;
  eventTypeId?: string;
  startTime?: string;
  endTime?: string;
  [key: string]: unknown;
}

export interface EventType {
  id: string;
  name?: string;
  [key: string]: unknown;
}

export interface Reservation {
  id: string;
  [key: string]: unknown;
}

export interface Participant {
  id: string;
  [key: string]: unknown;
}

export interface Specialization {
  id: string;
  name?: string;
  [key: string]: unknown;
}
