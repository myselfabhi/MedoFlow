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
  recommendedProducts?: { id: string; name: string; price: string; description: string | null }[];
}

export interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  discipline?: { id: string; name: string };
  disciplines?: { discipline: { id: string; name: string } }[];
  locationAssignments?: {
    id: string;
    isPrimary: boolean;
    location: { id: string; name: string; timezone: string };
  }[];
  providerServices: { serviceId: string }[];
  providerAvailability?: { weekday: number; locationId: string | null }[];
  providerUnavailability?: { date: string; startTime: string | null; endTime: string | null }[];
}

export interface Location {
  id: string;
  name: string;
  address: string | null;
  timezone: string;
}

export interface TimeSlot {
  providerId: string;
  locationId: string | null;
  serviceId: string;
  timezone: string;
  start: string;
  end: string;
  holdable?: boolean;
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
