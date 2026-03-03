'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProvider,
  updateAvailability,
  type ProviderWithAvailability,
  type ProviderAvailabilitySlot,
  type UpdateAvailabilityPayload,
} from '@/lib/availabilityApi';
import { ImpactModal } from '@/components/ImpactModal';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ProviderAvailabilityPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const providerId = params.id as string;

  const [toast, setToast] = useState<string | null>(null);
  const [impactModal, setImpactModal] = useState<{
    affectedCount: number;
    availabilityId: string;
    payload: UpdateAvailabilityPayload;
  } | null>(null);

  const { data: provider, isLoading, error } = useQuery({
    queryKey: ['provider', providerId],
    queryFn: () => getProvider(providerId),
    enabled: !!providerId,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      availabilityId,
      payload,
      force,
    }: {
      availabilityId: string;
      payload: UpdateAvailabilityPayload;
      force?: boolean;
    }) => updateAvailability(providerId, availabilityId, payload, { force }),
  });

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleUpdate = async (
    availabilityId: string,
    payload: UpdateAvailabilityPayload
  ) => {
    try {
      const result = await updateMutation.mutateAsync({
        availabilityId,
        payload,
      });
      if ('requiresConfirmation' in result && result.requiresConfirmation) {
        setImpactModal({
          affectedCount: result.affectedCount,
          availabilityId,
          payload,
        });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['provider', providerId] });
      setToast('Availability updated successfully.');
    } catch {
      // Error handled by mutation
    }
  };

  const handleForceUpdate = async () => {
    if (!impactModal) return;
    try {
      await updateMutation.mutateAsync({
        availabilityId: impactModal.availabilityId,
        payload: impactModal.payload,
        force: true,
      });
      setImpactModal(null);
      queryClient.invalidateQueries({ queryKey: ['provider', providerId] });
      setToast('Availability updated successfully.');
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading || !provider) {
    if (error) {
      return (
        <div className="space-y-6">
          <Link href="/dashboard/providers" className="text-sm text-primary-600 hover:text-primary-700">
            ← Back to providers
          </Link>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            Failed to load provider.
          </div>
        </div>
      );
    }
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard/providers" className="text-sm text-primary-600 hover:text-primary-700">
            ← Back to providers
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">
            Availability — {provider.firstName} {provider.lastName}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">{provider.discipline.name}</p>
        </div>
      </div>

      {toast && (
        <div
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
          role="status"
        >
          {toast}
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Schedule</h2>
          <p className="mt-1 text-sm text-gray-500">
            Edit weekly availability. Changes that affect existing appointments will require confirmation.
          </p>
        </CardHeader>
        <CardContent>
          {!provider.providerAvailability?.length ? (
            <p className="text-sm text-gray-500">No availability slots. Add slots from the provider profile.</p>
          ) : (
            <div className="space-y-4">
              {provider.providerAvailability.map((slot) => (
                <AvailabilityRow
                  key={slot.id}
                  slot={slot}
                  clinicId={provider.clinicId}
                  onUpdate={(payload) => handleUpdate(slot.id, payload)}
                  isSubmitting={updateMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {impactModal && (
        <ImpactModal
          isOpen={!!impactModal}
          onClose={() => setImpactModal(null)}
          affectedCount={impactModal.affectedCount}
          onForceUpdate={handleForceUpdate}
          onCancel={() => setImpactModal(null)}
          isForceLoading={updateMutation.isPending}
        />
      )}
    </div>
  );
}

function AvailabilityRow({
  slot,
  clinicId,
  onUpdate,
  isSubmitting,
}: {
  slot: ProviderAvailabilitySlot;
  clinicId: string;
  onUpdate: (payload: UpdateAvailabilityPayload) => void;
  isSubmitting: boolean;
}) {
  const [weekday, setWeekday] = useState(slot.weekday);
  const [startTime, setStartTime] = useState(slot.startTime);
  const [endTime, setEndTime] = useState(slot.endTime);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      weekday,
      startTime,
      endTime,
      clinicId,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-gray-50/50 p-4 sm:flex-nowrap"
    >
      <div className="w-full min-w-0 sm:w-40">
        <label className="block text-xs font-medium text-gray-500">Day</label>
        <select
          value={weekday}
          onChange={(e) => setWeekday(Number(e.target.value))}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {WEEKDAY_NAMES.map((name, i) => (
            <option key={i} value={i}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div className="w-full min-w-0 sm:w-28">
        <label className="block text-xs font-medium text-gray-500">Start</label>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="w-full min-w-0 sm:w-28">
        <label className="block text-xs font-medium text-gray-500">End</label>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Updating...' : 'Update'}
      </button>
    </form>
  );
}
