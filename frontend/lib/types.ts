export type Role = 'SUPER_ADMIN' | 'CLINIC_ADMIN' | 'PROVIDER' | 'STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  clinicId: string | null;
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
  role?: Role;
  clinicId?: string;
  clinicName?: string;
  clinicEmail?: string;
}
