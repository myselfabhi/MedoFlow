import api from './api';

export interface PaymentResponse {
  id: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  amount: string;
}

export const confirmPayment = async (
  appointmentId: string
): Promise<{ payment: PaymentResponse }> => {
  const { data } = await api.post<{
    success: boolean;
    data: { payment: PaymentResponse };
  }>(`/payments/${appointmentId}/confirm`);
  return { payment: data.data.payment };
};

export const failPayment = async (
  appointmentId: string
): Promise<{ payment: PaymentResponse }> => {
  const { data } = await api.post<{
    success: boolean;
    data: { payment: PaymentResponse };
  }>(`/payments/${appointmentId}/fail`);
  return { payment: data.data.payment };
};

