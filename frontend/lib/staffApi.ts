import api from './api';

export interface FrontDeskStaffMember {
  id: string;
  name: string;
  email: string;
  role: 'FRONT_DESK';
  isActive: boolean;
  createdAt: string;
}

export const listFrontDeskStaff = async (): Promise<FrontDeskStaffMember[]> => {
  const { data } = await api.get<{
    success: boolean;
    data: { staff: FrontDeskStaffMember[] };
  }>('/staff');
  return data.data.staff;
};

export const inviteFrontDeskStaff = async (payload: {
  name: string;
  email: string;
}): Promise<FrontDeskStaffMember> => {
  const { data } = await api.post<{
    success: boolean;
    data: { user: FrontDeskStaffMember };
  }>('/staff', payload);
  return data.data.user;
};
