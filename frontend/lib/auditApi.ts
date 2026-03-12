import api from './api';

export interface AuditLog {
  id: string;
  clinicId: string;
  entityType: string;
  entityId: string;
  action: string;
  fieldChanged: string | null;
  oldValue: any;
  newValue: any;
  performedById: string;
  createdAt: string;
  performedBy: {
    id: string;
    name: string;
    email: string;
  };
}

export const listAuditLogs = async (params?: {
  limit?: number;
  offset?: number;
}): Promise<{ logs: AuditLog[]; total: number }> => {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', params.limit.toString());
  if (params?.offset) query.set('offset', params.offset.toString());

  const { data } = await api.get<{
    success: boolean;
    data: { logs: AuditLog[]; total: number };
  }>(`/audit?${query.toString()}`);
  return data.data;
};
