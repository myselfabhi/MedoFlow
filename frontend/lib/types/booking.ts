export interface Clinic {
  id: string;
  name: string;
  email: string;
  subscriptionPlan: string;
}

export interface Service {
  id: string;
  name: string;
  duration: number;
  defaultPrice: string;
  discipline: { id: string; name: string };
}

export interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  discipline: { id: string; name: string };
  providerServices: { serviceId: string }[];
}

export interface Location {
  id: string;
  name: string;
  address: string | null;
  timezone: string;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface CreateAppointmentPayload {
  clinicId: string;
  locationId: string;
  providerId: string;
  serviceId: string;
  patientId: string;
  startTime: string;
  endTime: string;
}
