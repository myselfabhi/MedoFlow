import api from './api';

export interface Prescription {
  id: string;
  appointmentId: string;
  patientId: string;
  providerId: string;
  notes: string;
  createdAt: string;
  appointment?: { id: string; startTime: string; status: string };
  provider?: { id: string; firstName: string; lastName: string };
  patient?: { id: string; name: string; email: string };
}

export const createPrescription = async (payload: {
  appointmentId: string;
  patientId?: string;
  notes: string;
}): Promise<Prescription> => {
  const { data } = await api.post<{
    success: boolean;
    data: { prescription: Prescription };
  }>('/prescriptions', payload);
  return data.data.prescription;
};

export const getPrescriptionsByPatient = async (patientId: string): Promise<Prescription[]> => {
  const { data } = await api.get<{
    success: boolean;
    data: { prescriptions: Prescription[] };
  }>(`/prescriptions/patient/${patientId}`);
  return data.data.prescriptions;
};

export const getMyPrescriptions = async (): Promise<Prescription[]> => {
  const { data } = await api.get<{
    success: boolean;
    data: { prescriptions: Prescription[] };
  }>('/prescriptions/my');
  return data.data.prescriptions;
};
