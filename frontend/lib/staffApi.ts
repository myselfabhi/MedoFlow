import api from './api';

export type StaffRole = 'FRONT_DESK' | 'SUPER_ADMIN' | 'PROVIDER' | 'ACCOUNTING' | 'MARKETING' | 'STAFF';

export interface Permission {
  module: string;
  action: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  customRoleId: string | null;
  customRole: { id: string; name: string; permissions?: string[] } | null;
  permissions: Permission[] | null;
  isActive: boolean;
  createdAt: string;
  provider?: {
    id: string;
    disciplines?: { discipline: { name: string } }[];
    providerServices?: { service: { name: string } }[];
  } | null;
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

export const updateStaff = async (
  id: string,
  payload: { role?: StaffRole; permissions?: Permission[]; customRoleId?: string }
): Promise<StaffMember> => {
  const { data } = await api.patch<{
    success: boolean;
    data: { user: StaffMember };
  }>(`/staff/${id}`, payload);
  return data.data.user;
};

export const linkProviderToAdmin = async (
  id: string
): Promise<{ id: string; firstName: string; lastName: string }> => {
  const { data } = await api.post<{
    success: boolean;
    data: { provider: { id: string; firstName: string; lastName: string } };
  }>(`/staff/${id}/link-provider`);
  return data.data.provider;
};

export const inviteStaff = async (payload: {
  name?: string;
  email: string;
  role: StaffRole;
  permissions?: Permission[];
  customRoleId?: string;
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
