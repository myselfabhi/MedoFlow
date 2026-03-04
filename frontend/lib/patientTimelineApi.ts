import api from './api';
import type { PatientAppointment } from './patientApi';
import type { VisitRecord } from './patientApi';
import type { Prescription } from './patientApi';
import type { TreatmentPlan } from './treatmentPlanApi';

export type TimelineEventType =
    | 'APPOINTMENT'
    | 'VISIT'
    | 'PRESCRIPTION'
    | 'PLAN_CREATED'
    | 'PLAN_COMPLETED'
    | 'PLAN_DISCONTINUED'
    | 'FORM_SUBMITTED';

export type TimelineEvent = {
    id: string;
    type: TimelineEventType;
    title: string;
    description?: string;
    date: string;
};

export const getAppointmentsByPatient = async (
    patientId: string,
    clinicId?: string
): Promise<PatientAppointment[]> => {
    const params = clinicId ? `?clinicId=${clinicId}` : '';
    const { data } = await api.get<{
        success: boolean;
        data: { appointments: PatientAppointment[] };
    }>(`/appointments/patient/${patientId}${params}`);
    return data.data.appointments;
};

export const getVisitsByPatient = async (
    patientId: string,
    clinicId?: string
): Promise<VisitRecord[]> => {
    const params = clinicId ? `?clinicId=${clinicId}` : '';
    const { data } = await api.get<{
        success: boolean;
        data: { visitRecords: VisitRecord[] };
    }>(`/visits/patient/${patientId}${params}`);
    return data.data.visitRecords;
};

export const getFormResponsesByPatient = async (
    patientId: string,
    clinicId?: string
): Promise<{ id: string; templateId: string; template: { id: string; name: string }; createdAt: string }[]> => {
    const params = clinicId ? `?clinicId=${clinicId}` : '';
    const { data } = await api.get<{
        success: boolean;
        data: { responses: { id: string; templateId: string; template: { id: string; name: string }; createdAt: string }[] };
    }>(`/forms/patient/${patientId}${params}`);
    return data.data.responses;
};

export const getPrescriptionsByPatient = async (
    patientId: string,
    clinicId?: string
): Promise<Prescription[]> => {
    const params = clinicId ? `?clinicId=${clinicId}` : '';
    const { data } = await api.get<{
        success: boolean;
        data: { prescriptions: Prescription[] };
    }>(`/prescriptions/patient/${patientId}${params}`);
    return data.data.prescriptions;
};

export { getPlansByPatient } from './treatmentPlanApi';
