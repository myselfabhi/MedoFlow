import api from './api';

export interface CommissionRuleRecord {
  id: string;
  providerId?: string | null;
  itemType: 'ALL' | 'SERVICE' | 'PRODUCT' | 'PACKAGE';
  serviceId?: string | null;
  productId?: string | null;
  packageId?: string | null;
  commissionType: 'PERCENTAGE' | 'FLAT_RATE';
  commissionValue: string;
  isActive: boolean;
  provider?: { id: string; firstName: string; lastName: string } | null;
  service?: { id: string; name: string } | null;
  product?: { id: string; name: string } | null;
  package?: { id: string; name: string } | null;
}

export interface CommissionLedgerRecord {
  id: string;
  amount: string;
  basisAmount: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  earnedAt: string;
  paidOutAt?: string | null;
  provider: { id: string; firstName: string; lastName: string };
  invoice: { id: string };
  invoiceItem?: {
    id: string;
    service?: { id: string; name: string } | null;
    product?: { id: string; name: string } | null;
    package?: { id: string; name: string } | null;
  };
}

export interface CommissionLedgerSummary {
  totalRecords: number;
  pendingCount: number;
  paidCount: number;
  cancelledCount: number;
  totalAmount: string;
  pendingAmount: string;
  paidAmount: string;
}

export const getCommissionRules = async (includeInactive = false): Promise<CommissionRuleRecord[]> => {
  const { data } = await api.get<{
    success: boolean;
    data: { rules: CommissionRuleRecord[] };
  }>('/commissions/rules', {
    params: includeInactive ? { includeInactive: 'true' } : undefined,
  });
  return data.data.rules;
};

export const createCommissionRule = async (payload: {
  providerId?: string;
  itemType: 'ALL' | 'SERVICE' | 'PRODUCT' | 'PACKAGE';
  serviceId?: string;
  productId?: string;
  packageId?: string;
  commissionType: 'PERCENTAGE' | 'FLAT_RATE';
  commissionValue: number;
  isActive?: boolean;
}) => {
  const { data } = await api.post<{
    success: boolean;
    data: { rule: CommissionRuleRecord };
  }>('/commissions/rules', payload);
  return data.data.rule;
};

export const updateCommissionRule = async (
  id: string,
  payload: Partial<{
    providerId?: string;
    itemType: 'ALL' | 'SERVICE' | 'PRODUCT' | 'PACKAGE';
    serviceId?: string;
    productId?: string;
    packageId?: string;
    commissionType: 'PERCENTAGE' | 'FLAT_RATE';
    commissionValue: number;
    isActive: boolean;
  }>
) => {
  const { data } = await api.put<{
    success: boolean;
    data: { rule: CommissionRuleRecord };
  }>(`/commissions/rules/${id}`, payload);
  return data.data.rule;
};

export const getCommissionRecords = async (filters?: {
  providerId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<{ records: CommissionLedgerRecord[]; summary: CommissionLedgerSummary }> => {
  const { data } = await api.get<{
    success: boolean;
    data: { records: CommissionLedgerRecord[]; summary: CommissionLedgerSummary };
  }>('/commissions/records', { params: filters });
  return data.data;
};

export const markCommissionRecordsPaid = async (recordIds: string[]) => {
  await api.post('/commissions/mark-paid', { recordIds });
};
