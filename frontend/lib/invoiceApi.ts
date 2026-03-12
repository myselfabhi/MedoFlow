import api from './api';

export interface InvoiceItem {
  id: string;
  serviceId?: string | null;
  productId?: string | null;
  packageId?: string | null;
  description: string;
  unitPrice: string;
  quantity: number;
  totalPrice: string;
  service?: { id: string; name: string };
  product?: { id: string; name: string };
  package?: { id: string; name: string };
}

export interface InvoicePayment {
  id: string;
  amount: string;
  status: string;
  paymentChannel?: string | null;
  paymentMethod?: string | null;
  recordedAt?: string | null;
  notes?: string | null;
  refundForPaymentId?: string | null;
}

export interface Invoice {
  id: string;
  clinicId: string;
  appointmentId: string | null;
  patientId: string;
  providerId: string | null;
  status: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  totalPaid: string;
  totalRefunded: string;
  netCollected: string;
  outstandingAmount: string;
  financialStatus: string;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItem[];
  appointment?: { id: string; startTime: string };
  patient?: { id: string; name: string; email: string };
  provider?: { id: string; firstName: string; lastName: string };
  payments?: InvoicePayment[];
}

export const createInvoice = async (payload: {
  appointmentId?: string;
  providerId?: string;
  patientId?: string;
  locationId?: string;
}): Promise<Invoice> => {
  const { data } = await api.post<{ success: boolean; data: { invoice: Invoice } }>(
    '/invoices',
    payload
  );
  return data.data.invoice;
};

export const addInvoiceItem = async (
  invoiceId: string,
  payload: {
    serviceId?: string;
    itemType?: 'SERVICE' | 'PRODUCT' | 'PACKAGE';
    itemId?: string;
    description?: string;
    unitPrice?: number;
    quantity?: number;
  }
) => {
  const { data } = await api.post<{ success: boolean; data: { item: InvoiceItem } }>(
    `/invoices/${invoiceId}/items`,
    payload
  );
  return data.data.item;
};

export const updateInvoiceItem = async (
  invoiceId: string,
  itemId: string,
  payload: { unitPrice?: number; quantity?: number }
): Promise<InvoiceItem> => {
  const { data } = await api.put<{ success: boolean; data: { item: InvoiceItem } }>(
    `/invoices/${invoiceId}/items/${itemId}`,
    payload
  );
  return data.data.item;
};

export const deleteInvoiceItem = async (
  invoiceId: string,
  itemId: string
): Promise<void> => {
  await api.delete(`/invoices/${invoiceId}/items/${itemId}`);
};

export const finalizeInvoice = async (invoiceId: string): Promise<Invoice> => {
  const { data } = await api.put<{ success: boolean; data: { invoice: Invoice } }>(
    `/invoices/${invoiceId}/finalize`
  );
  return data.data.invoice;
};

export const payInvoice = async (invoiceId: string): Promise<Invoice> => {
  const { data } = await api.put<{ success: boolean; data: { invoice: Invoice } }>(
    `/invoices/${invoiceId}/pay`
  );
  return data.data.invoice;
};

export const recordManualInvoicePayment = async (
  invoiceId: string,
  payload: {
    amount: number;
    paymentMethod: string;
    notes?: string;
  }
): Promise<{ invoice: Invoice; payment: { id: string; amount: string; paymentMethod?: string | null } }> => {
  const { data } = await api.post<{
    success: boolean;
    data: { invoice: Invoice; payment: { id: string; amount: string; paymentMethod?: string | null } };
  }>(`/invoices/${invoiceId}/payments/manual`, payload);
  return data.data;
};

export const refundPayment = async (
  paymentId: string,
  payload?: { amount?: number }
): Promise<{ refund: { id: string; amount: string } }> => {
  const { data } = await api.post<{
    success: boolean;
    data: { refund: { id: string; amount: string } };
  }>(`/payments/${paymentId}/refund`, payload ?? {});
  return data.data;
};

export const getInvoiceById = async (id: string): Promise<Invoice> => {
  const { data } = await api.get<{ success: boolean; data: { invoice: Invoice } }>(
    `/invoices/${id}`
  );
  return data.data.invoice;
};

export const getInvoices = async (status?: string): Promise<Invoice[]> => {
  const params = new URLSearchParams();
  if (status && status !== 'ALL') params.set('status', status);
  const qs = params.toString();
  const { data } = await api.get<{
    success: boolean;
    data: { invoices: Invoice[] };
  }>(`/invoices${qs ? `?${qs}` : ''}`);
  return data.data.invoices;
};

export const getReceivablesSummary = async (): Promise<{
  totalOutstandingAmount: string;
  outstandingInvoiceCount: number;
  partiallyPaidCount: number;
  partiallyRefundedCount: number;
  unpaidCount: number;
  paidCount: number;
  refundedCount: number;
}> => {
  const { data } = await api.get<{
    success: boolean;
    data: {
      summary: {
        totalOutstandingAmount: string;
        outstandingInvoiceCount: number;
        partiallyPaidCount: number;
        partiallyRefundedCount: number;
        unpaidCount: number;
        paidCount: number;
        refundedCount: number;
      };
    };
  }>('/invoices/summary/receivables');
  return data.data.summary;
};

export const getInvoicesByAppointment = async (
  appointmentId: string
): Promise<Invoice[]> => {
  const { data } = await api.get<{
    success: boolean;
    data: { invoices: Invoice[] };
  }>(`/invoices/appointment/${appointmentId}`);
  return data.data.invoices;
};
