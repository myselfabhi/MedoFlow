import api from './api';

export interface PaymentResponse {
  id: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  amount: string;
}

export const getOrCreatePaymentIntent = async (
  appointmentId: string
): Promise<{
  payment: PaymentResponse | null;
  clientSecret: string | null;
  reused: boolean;
}> => {
  const { data } = await api.post<{
    success: boolean;
    data: {
      payment: PaymentResponse | null;
      clientSecret: string | null;
      reused: boolean;
    };
  }>(`/payments/${appointmentId}/intent`);
  return data.data;
};

export const confirmPayment = async (
  appointmentId: string
): Promise<{ payment: PaymentResponse }> => {
  const { data } = await api.post<{
    success: boolean;
    data: { payment: PaymentResponse };
  }>(`/payments/${appointmentId}/confirm`);
  return { payment: data.data.payment };
};

export const demoConfirmPayment = async (
  appointmentId: string
): Promise<{ payment: PaymentResponse }> => {
  const { data } = await api.post<{
    success: boolean;
    data: { payment: PaymentResponse };
  }>(`/payments/${appointmentId}/demo-confirm`);
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
