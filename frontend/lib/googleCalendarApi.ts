import api from './api';
import type { AIScribeSession } from './aiScribeApi';

export interface GoogleMeetingEvent {
  id: string;
  summary: string | null;
  startTime: string;
  endTime: string;
  meetLink: string | null;
  appointmentId: string | null;
  status: string;
}

export interface GoogleCalendarConnectionStatus {
  connected: boolean;
  email?: string;
  tokenExpiry?: string | null;
  lastSyncedAt?: string | null;
}

export const getGoogleAuthUrl = async (
  redirectUri: string
): Promise<string> => {
  const { data } = await api.get<{
    success: boolean;
    data: { authUrl: string };
  }>(`/integrations/google/auth-url?redirectUri=${encodeURIComponent(redirectUri)}`);
  return data.data.authUrl;
};

export const connectGoogleCalendar = async (
  code: string,
  redirectUri: string
) => {
  const { data } = await api.post('/integrations/google/connect', {
    code,
    redirectUri,
  });
  return data.data.connection;
};

export const syncGoogleMeetings = async (
  redirectUri: string,
  days = 7
) => {
  const { data } = await api.post<{
    success: boolean;
    data: { syncedCount: number };
  }>('/integrations/google/sync', { redirectUri, days });
  return data.data;
};

export const listGoogleMeetings = async (): Promise<GoogleMeetingEvent[]> => {
  const { data } = await api.get<{
    success: boolean;
    data: { events: GoogleMeetingEvent[] };
  }>('/integrations/google/events');
  return data.data.events;
};

export const getGoogleConnectionStatus =
  async (): Promise<GoogleCalendarConnectionStatus> => {
    const { data } = await api.get<{
      success: boolean;
      data: { status: GoogleCalendarConnectionStatus };
    }>('/integrations/google/status');
    return data.data.status;
  };

export const disconnectGoogleCalendar = async (): Promise<boolean> => {
  const { data } = await api.delete<{
    success: boolean;
    data: { disconnected: boolean };
  }>('/integrations/google/disconnect');
  return data.data.disconnected;
};

export const startScribeFromMeeting = async (
  eventId: string
): Promise<{ session: AIScribeSession; visitRecord: { id: string; appointmentId: string } }> => {
  const { data } = await api.post<{
    success: boolean;
    data: {
      session: AIScribeSession;
      visitRecord: { id: string; appointmentId: string };
    };
  }>(`/integrations/google/events/${eventId}/start-scribe`);
  return data.data;
};

export interface AppointmentCandidate {
  id: string;
  startTime: string;
  endTime: string;
  patient: { id: string; name: string };
  service: { id: string; name: string };
}

export const listEventAppointmentCandidates = async (
  eventId: string
): Promise<AppointmentCandidate[]> => {
  const { data } = await api.get<{
    success: boolean;
    data: { appointments: AppointmentCandidate[] };
  }>(`/integrations/google/events/${eventId}/appointments-candidates`);
  return data.data.appointments;
};

export const linkMeetingToAppointment = async (
  eventId: string,
  appointmentId: string
) => {
  const { data } = await api.post<{
    success: boolean;
    data: { event: GoogleMeetingEvent };
  }>(`/integrations/google/events/${eventId}/link-appointment`, {
    appointmentId,
  });
  return data.data.event;
};
