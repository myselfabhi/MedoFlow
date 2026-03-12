import api from './api';

export interface PackageCatalogRecord {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  totalSessions: number;
  expiresInDays?: number | null;
  isActive: boolean;
}

export interface PackageOperationalSummary {
  activeCatalogPackages: number;
  patientPackageCount: number;
  activePatientPackageCount: number;
  exhaustedCount: number;
  expiringSoonCount: number;
  remainingSessionsTotal: number;
  recentPatientPackages: Array<{
    id: string;
    status: string;
    totalSessions: number;
    usedSessions: number;
    remainingSessions: number;
    expiresAt?: string | null;
    patient: { id: string; name: string; email: string };
    package: { id: string; name: string };
  }>;
}

export const getPackages = async (includeInactive = false): Promise<PackageCatalogRecord[]> => {
  const { data } = await api.get<{
    success: boolean;
    data: { packages: PackageCatalogRecord[] };
  }>('/packages', {
    params: includeInactive ? { includeInactive: 'true' } : undefined,
  });
  return data.data.packages;
};

export const getPackageOperationalSummary = async (): Promise<PackageOperationalSummary> => {
  const { data } = await api.get<{
    success: boolean;
    data: { summary: PackageOperationalSummary };
  }>('/packages/summary');
  return data.data.summary;
};
