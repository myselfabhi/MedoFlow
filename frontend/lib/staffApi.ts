import api from './api';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'FRONT_DESK' | 'SUPER_ADMIN' | 'PROVIDER';
  isActive: boolean;
  createdAt: string;
}

export const listStaff = async (): Promise<StaffMember[]> => {
  const { data } = await api.get<{
    success: boolean;
    data: { staff: StaffMember[] };
  }>('/staff');
  return data.data.staff;
};

export const deactivateStaff = async (id: string): Promise<void> => {
  await api.delete(`/staff/${id}`);
};

export const inviteStaff = async (payload: {
  name?: string;
  email: string;
  role: 'FRONT_DESK' | 'PROVIDER';
  // Provider-specific fields:
  firstName?: string;
  lastName?: string;
  disciplineIds?: string[];
  serviceIds?: string[];
}): Promise<StaffMember> => {
  const { data } = await api.post<{
    success: boolean;
    data: { user?: StaffMember; provider?: any };
  }>('/staff', payload);
  return data.data.user || data.data.provider?.user;
};
