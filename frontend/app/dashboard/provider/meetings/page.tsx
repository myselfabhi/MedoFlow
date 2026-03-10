'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  AppButton,
  AppCard,
  AppCardContent,
  AppCardHeader,
  AppPageHeader,
} from '@/components/ui-system';
import {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  getGoogleConnectionStatus,
  getGoogleAuthUrl,
  listEventAppointmentCandidates,
  linkMeetingToAppointment,
  listGoogleMeetings,
  startScribeFromMeeting,
  syncGoogleMeetings,
} from '@/lib/googleCalendarApi';

export default function ProviderMeetingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const redirectUri =
    typeof window !== 'undefined'
      ? `${window.location.origin}/dashboard/provider/meetings`
      : '';

  const { data: events, isLoading } = useQuery({
    queryKey: ['google-meetings'],
    queryFn: () => listGoogleMeetings(),
    enabled: user?.role === 'PROVIDER',
  });
  const { data: connectionStatus } = useQuery({
    queryKey: ['google-meetings-status'],
    queryFn: () => getGoogleConnectionStatus(),
    enabled: user?.role === 'PROVIDER',
  });
  const [linkingEventId, setLinkingEventId] = React.useState<string | null>(null);
  const [selectedAppointmentByEvent, setSelectedAppointmentByEvent] = React.useState<
    Record<string, string>
  >({});
  const { data: candidateAppointments } = useQuery({
    queryKey: ['meeting-appointment-candidates', linkingEventId],
    queryFn: () => listEventAppointmentCandidates(linkingEventId!),
    enabled: !!linkingEventId,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const authUrl = await getGoogleAuthUrl(redirectUri);
      window.location.href = authUrl;
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => syncGoogleMeetings(redirectUri, 7),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-meetings'] });
    },
  });
  const disconnectMutation = useMutation({
    mutationFn: () => disconnectGoogleCalendar(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['google-meetings-status'] });
    },
  });

  const linkMutation = useMutation({
    mutationFn: ({
      eventId,
      appointmentId,
    }: {
      eventId: string;
      appointmentId: string;
    }) => linkMeetingToAppointment(eventId, appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-meetings'] });
      setLinkingEventId(null);
    },
  });

  const startScribeMutation = useMutation({
    mutationFn: (eventId: string) => startScribeFromMeeting(eventId),
    onSuccess: (data) => {
      router.push(
        `/dashboard/provider/visits/${data.visitRecord.id}/scribe?appointmentId=${data.visitRecord.appointmentId}`
      );
    },
  });

  React.useEffect(() => {
    const code = searchParams.get('code');
    const scope = searchParams.get('scope');
    if (!code || !scope || user?.role !== 'PROVIDER') return;

    let cancelled = false;
    const run = async () => {
      try {
        await connectGoogleCalendar(code, redirectUri);
        await syncGoogleMeetings(redirectUri, 7);
        if (!cancelled) {
          queryClient.invalidateQueries({ queryKey: ['google-meetings'] });
          router.replace('/dashboard/provider/meetings');
        }
      } catch {
        if (!cancelled) {
          router.replace('/dashboard/provider/meetings');
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [searchParams, redirectUri, user?.role, queryClient, router]);

  if (user?.role !== 'PROVIDER') {
    return (
      <AppCard>
        <AppCardContent className="py-8">
          This page is only available for providers.
        </AppCardContent>
      </AppCard>
    );
  }

  return (
    <div className="space-y-6">
      <AppPageHeader
        title="Google Meet Scribe"
        description="Connect Google Calendar, sync upcoming Meet calls, and start AI Scribe directly."
      />

      <AppCard>
        <AppCardHeader>
          <h2 className="text-lg font-semibold text-foreground">Integration</h2>
        </AppCardHeader>
        <AppCardContent className="flex flex-wrap gap-3">
          <AppButton
            onClick={() => connectMutation.mutate()}
            disabled={connectMutation.isPending}
          >
            Connect Google Calendar
          </AppButton>
          <AppButton
            variant="outline"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            Sync Upcoming Meetings
          </AppButton>
          <AppButton
            variant="outline"
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
          >
            Disconnect
          </AppButton>
          <div className="text-xs text-muted-foreground">
            {connectionStatus?.connected
              ? `Connected as ${connectionStatus.email}`
              : 'Not connected'}
          </div>
        </AppCardContent>
      </AppCard>

      <AppCard>
        <AppCardHeader>
          <h2 className="text-lg font-semibold text-foreground">Upcoming Meet Events</h2>
        </AppCardHeader>
        <AppCardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading meetings...</p>
          ) : !events || events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No Google Meet events found. Connect and sync to pull meetings.
            </p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-2 rounded-lg border border-border p-3"
                >
                  <div className="text-sm font-medium text-foreground">
                    {event.summary || 'Untitled meeting'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(event.startTime).toLocaleString()} -{' '}
                    {new Date(event.endTime).toLocaleTimeString()}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {event.meetLink && (
                      <a
                        href={event.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-accent hover:underline"
                      >
                        Open Meet
                      </a>
                    )}
                    <AppButton
                      size="sm"
                      onClick={() => startScribeMutation.mutate(event.id)}
                      disabled={startScribeMutation.isPending || !event.appointmentId}
                    >
                      Start AI Scribe
                    </AppButton>
                    {!event.appointmentId && (
                      <>
                        <span className="text-xs text-amber-700">
                          No matching appointment found
                        </span>
                        <AppButton
                          size="sm"
                          variant="outline"
                          onClick={() => setLinkingEventId(event.id)}
                        >
                          Link Appointment
                        </AppButton>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </AppCardContent>
      </AppCard>

      {linkingEventId && (
        <AppCard>
          <AppCardHeader>
            <h2 className="text-lg font-semibold text-foreground">
              Link Meeting to Appointment
            </h2>
          </AppCardHeader>
          <AppCardContent className="space-y-3">
            <select
              className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
              value={selectedAppointmentByEvent[linkingEventId] ?? ''}
              onChange={(e) =>
                setSelectedAppointmentByEvent((prev) => ({
                  ...prev,
                  [linkingEventId]: e.target.value,
                }))
              }
            >
              <option value="">Select appointment</option>
              {(candidateAppointments ?? []).map((apt) => (
                <option key={apt.id} value={apt.id}>
                  {new Date(apt.startTime).toLocaleString()} | {apt.patient.name} |{' '}
                  {apt.service.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <AppButton
                onClick={() =>
                  linkMutation.mutate({
                    eventId: linkingEventId,
                    appointmentId: selectedAppointmentByEvent[linkingEventId] || '',
                  })
                }
                disabled={
                  linkMutation.isPending ||
                  !selectedAppointmentByEvent[linkingEventId]
                }
              >
                Link
              </AppButton>
              <AppButton variant="outline" onClick={() => setLinkingEventId(null)}>
                Cancel
              </AppButton>
            </div>
          </AppCardContent>
        </AppCard>
      )}
    </div>
  );
}
