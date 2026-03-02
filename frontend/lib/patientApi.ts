import api from './api';

export type AppointmentStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'RESCHEDULED';

export type VisitRecordStatus = 'DRAFT' | 'FINAL';

export interface PatientAppointment {
  id: string;
  clinicId: string;
  locationId: string;
  providerId: string;
  serviceId: string;
  patientId: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  priceAtBooking: string;
  createdAt: string;
  updatedAt: string;
  location: { id: string; name: string };
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    discipline: { id: string; name: string };
    user: { id: string; name: string };
  };
  service: { id: string; name: string };
}

export interface PatientAppointmentDetail extends PatientAppointment {
  clinic: { id: string; name: string };
  service: { id: string; name: string; duration: number };
}

export interface VisitRecord {
  id: string;
  clinicId: string;
  appointmentId: string;
  providerId: string;
  patientId: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  status: VisitRecordStatus;
  createdAt: string;
  updatedAt: string;
  provider: { id: string; firstName: string; lastName: string };
}

export interface Prescription {
  id: string;
  clinicId: string;
  appointmentId: string;
  providerId: string;
  patientId: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  appointment: { id: string; startTime: string };
  provider: { id: string; firstName: string; lastName: string };
}

export const getMyAppointments = async (
  clinicId?: string
): Promise<PatientAppointment[]> => {
  const params = clinicId ? `?clinicId=${clinicId}` : '';
  const { data } = await api.get<{
    success: boolean;
    data: { appointments: PatientAppointment[] };
  }>(`/appointments/my${params}`);
  return data.data.appointments;
};

export const getAppointmentById = async (
  id: string
): Promise<PatientAppointmentDetail> => {
  const { data } = await api.get<{
    success: boolean;
    data: { appointment: PatientAppointmentDetail };
  }>(`/appointments/${id}`);
  return data.data.appointment;
};

export const getVisitByAppointment = async (
  appointmentId: string,
  clinicId?: string
): Promise<VisitRecord | null> => {
  try {
    const params = clinicId ? `?clinicId=${clinicId}` : '';
    const { data } = await api.get<{
      success: boolean;
      data: { visitRecord: VisitRecord };
    }>(`/visits/appointment/${appointmentId}${params}`);
    return data.data.visitRecord;
  } catch {
    return null;
  }
};

export const getMyPrescriptions = async (
  clinicId?: string
): Promise<Prescription[]> => {
  const params = clinicId ? `?clinicId=${clinicId}` : '';
  const { data } = await api.get<{
    success: boolean;
    data: { prescriptions: Prescription[] };
  }>(`/prescriptions/my${params}`);
  return data.data.prescriptions;
};
