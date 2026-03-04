import api, { getAccessToken } from './api';

export interface PatientFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  tags: string[] | null;
  createdAt: string;
  uploadedBy: { id: string; name: string; email: string };
  visitRecord?: { id: string };
}

export const getPatientFiles = async (
  patientId: string,
  clinicId?: string
): Promise<PatientFile[]> => {
  const params = clinicId ? `?clinicId=${clinicId}` : '';
  const { data } = await api.get<{
    success: boolean;
    data: { files: PatientFile[] };
  }>(`/files/patient/${patientId}${params}`);
  return data.data.files;
};

export const deletePatientFile = async (
  fileId: string,
  clinicId?: string
): Promise<void> => {
  const params = clinicId ? `?clinicId=${clinicId}` : '';
  await api.delete(`/files/${fileId}${params}`);
};

export const downloadPatientFile = async (
  fileId: string,
  originalName: string,
  clinicId?: string
): Promise<void> => {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const params = clinicId ? `?clinicId=${clinicId}` : '';
  const url = `${base}/api/v1/files/${fileId}/download${params}`;
  const token = getAccessToken();
  const res = await fetch(url, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = originalName;
  a.click();
  URL.revokeObjectURL(a.href);
};
