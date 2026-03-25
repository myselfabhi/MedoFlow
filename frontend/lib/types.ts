export type Role = 'SUPER_ADMIN' | 'PROVIDER' | 'FRONT_DESK' | 'PATIENT' | 'STAFF' | 'ACCOUNTING' | 'MARKETING';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  clinicId: string | null;
  customRoleId?: string | null;
  customRoleName?: string | null;
  permissions?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}
