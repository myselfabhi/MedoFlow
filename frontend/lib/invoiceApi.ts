import api from './api';

export interface InvoiceItem {
  id: string;
  serviceId: string;
  description: string;
  unitPrice: string;
  quantity: number;
  totalPrice: string;
  service?: { id: string; name: string };
}

export interface Invoice {
  id: string;
  clinicId: string;
  appointmentId: string;
  patientId: string;
  providerId: string;
  status: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItem[];
  appointment?: { id: string; startTime: string };
  patient?: { id: string; name: string; email: string };
  provider?: { id: string; firstName: string; lastName: string };
}

export const createInvoice = async (payload: {
  appointmentId: string;
  providerId: string;
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
    serviceId: string;
    description: string;
    unitPrice: number;
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

export const getInvoicesByAppointment = async (
  appointmentId: string
): Promise<Invoice[]> => {
  const { data } = await api.get<{
    success: boolean;
    data: { invoices: Invoice[] };
  }>(`/invoices/appointment/${appointmentId}`);
  return data.data.invoices;
};
