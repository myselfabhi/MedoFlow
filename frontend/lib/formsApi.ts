import api from './api';

export interface FormFieldDefinition {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'checkbox' | 'select';
  label: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  scope: string;
  fields: FormFieldDefinition[];
  discipline?: { id: string; name: string };
  service?: { id: string; name: string };
}

export interface FormResponsePayload {
  templateId: string;
  patientId: string;
  appointmentId?: string;
  responses: Record<string, unknown>;
}

export const submitFormResponse = async (payload: FormResponsePayload) => {
  const { data } = await api.post<{ success: boolean; data: { response: unknown } }>(
    '/forms/respond',
    payload
  );
  return data.data;
};

export interface FormResponseItem {
  id: string;
  templateId: string;
  appointmentId: string | null;
  responses: Record<string, unknown>;
  createdAt: string;
  template: { id: string; name: string; scope: string };
  appointment?: { id: string; startTime: string };
}

export const getPatientForms = async (
  patientId: string,
  clinicId?: string
): Promise<FormResponseItem[]> => {
  const params = clinicId ? `?clinicId=${clinicId}` : '';
  const { data } = await api.get<{
    success: boolean;
    data: { responses: FormResponseItem[] };
  }>(`/forms/patient/${patientId}${params}`);
  return data.data.responses;
};

export const getTemplatesForAppointment = async (
  appointmentId: string
): Promise<FormTemplate[]> => {
  const { data } = await api.get<{
    success: boolean;
    data: { templates: FormTemplate[] };
  }>(`/forms/templates/for-appointment/${appointmentId}`);
  return data.data.templates;
};
