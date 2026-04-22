import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: Role;
        clinicId: string | null;
        customRoleId: string | null;
        customRoleName: string | null;
        permissions: string[];
        hasSeenPatientTour?: boolean;
      };
      clinicId?: string | null;
      bypassClinicScope?: boolean;
    }
  }
}

export {};
