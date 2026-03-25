import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PermissionDef {
  key: string;
  label: string;
  description?: string;
}

export interface PermissionGroup {
  module: string;
  label: string;
  permissions: PermissionDef[];
}

export interface RolePreset {
  description: string;
  permissions: string[];
}

export interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  isPreset: boolean;
  permissions: string[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
  users?: { id: string; name: string; email: string }[];
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const listRoles = async (): Promise<CustomRole[]> => {
  const { data } = await api.get<{
    success: boolean;
    data: { roles: CustomRole[] };
  }>('/roles');
  return data.data.roles;
};

export const getRole = async (id: string): Promise<CustomRole> => {
  const { data } = await api.get<{
    success: boolean;
    data: { role: CustomRole };
  }>(`/roles/${id}`);
  return data.data.role;
};

export const createRole = async (payload: {
  name: string;
  description?: string;
  permissions: string[];
  presetKey?: string;
}): Promise<CustomRole> => {
  const { data } = await api.post<{
    success: boolean;
    data: { role: CustomRole };
  }>('/roles', payload);
  return data.data.role;
};

export const updateRole = async (
  id: string,
  payload: {
    name?: string;
    description?: string;
    permissions?: string[];
  }
): Promise<CustomRole> => {
  const { data } = await api.put<{
    success: boolean;
    data: { role: CustomRole };
  }>(`/roles/${id}`, payload);
  return data.data.role;
};

export const deleteRole = async (id: string): Promise<void> => {
  await api.delete(`/roles/${id}`);
};

export const seedPresetRoles = async (): Promise<void> => {
  await api.post('/roles/seed-presets');
};

export const getPermissionRegistry = async (): Promise<{
  groups: PermissionGroup[];
  presets: Record<string, RolePreset>;
}> => {
  const { data } = await api.get<{
    success: boolean;
    data: {
      groups: PermissionGroup[];
      presets: Record<string, RolePreset>;
    };
  }>('/roles/permissions');
  return data.data;
};
