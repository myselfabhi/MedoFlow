'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProvider,
  createAvailability,
  updateAvailability,
  createUnavailability,
  deactivateProvider,
  type ProviderWithAvailability,
  type ProviderAvailabilitySlot,
  type UpdateAvailabilityPayload,
} from '@/lib/availabilityApi';
import { useRouter } from 'next/navigation';
import { ImpactModal } from '@/components/ImpactModal';
import { ProviderServicesCard } from '@/components/providers/ProviderServicesCard';
import { EditProviderDialog } from '@/components/providers/EditProviderDialog';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MIN_SLOT_MINUTES = 30;
const TIME_INPUT_STEP_SECONDS = 30 * 60;

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayDateValue() {
  return formatDateInputValue(new Date());
}

function getDateWeekday(date: string) {
  if (!date) return new Date().getDay();
  return new Date(`${date}T00:00:00`).getDay();
}

function getNextDateForWeekday(weekday: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const offset = (weekday - today.getDay() + 7) % 7;
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + offset);
  return formatDateInputValue(nextDate);
}

function getMinutesBetweenTimes(startTime: string, endTime: string) {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  return (endHours ?? 0) * 60 + (endMinutes ?? 0) - ((startHours ?? 0) * 60 + (startMinutes ?? 0));
}

export default function ProviderAvailabilityPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const providerId = params.id as string;

  const [toast, setToast] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] = useState(false);
  const [showUnavailabilityForm, setShowUnavailabilityForm] = useState(false);
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

  const createMutation = useMutation({
    mutationFn: (payload: { weekday: number; startTime: string; endTime: string }) =>
      createAvailability(providerId, payload),
  });

  const unavailabilityMutation = useMutation({
    mutationFn: (payload: { date: string; startTime?: string; endTime?: string; reason?: string }) =>
      createUnavailability(providerId, payload),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateProvider(providerId),
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

  const handleAddSlot = async (payload: { weekday: number; startTime: string; endTime: string }) => {
    try {
      await createMutation.mutateAsync(payload);
      queryClient.invalidateQueries({ queryKey: ['provider', providerId] });
      setShowAddForm(false);
      setToast('Availability slot added.');
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

  const handleDeactivate = async () => {
    if (!deactivateConfirm) {
      setDeactivateConfirm(true);
      return;
    }
    try {
      await deactivateMutation.mutateAsync();
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      router.push('/dashboard/providers');
    } catch {
      setDeactivateConfirm(false);
    }
  };

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
          <p className="mt-0.5 text-sm text-gray-500">
            {provider.disciplines?.length
              ? provider.disciplines.map((pd) => pd.discipline.name).join(' · ')
              : provider.discipline?.name ?? ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
            Edit Provider
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={deactivateConfirm ? 'border-red-500 text-red-600' : ''}
            onClick={handleDeactivate}
            disabled={deactivateMutation.isPending}
          >
            {deactivateConfirm ? 'Click again to deactivate' : 'Deactivate'}
          </Button>
        </div>
      </div>

      <EditProviderDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        provider={provider}
      />

      {toast && (
        <div
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
          role="status"
        >
          {toast}
        </div>
      )}

      <ProviderServicesCard providerId={providerId} />

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Schedule</h2>
          <p className="mt-1 text-sm text-gray-500">
            Pick a date with a start and end time. Each saved range is treated as online availability.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {provider.providerAvailability?.length ? (
              provider.providerAvailability.map((slot) => (
                <AvailabilityRow
                  key={slot.id}
                  slot={slot}
                  onUpdate={(payload) => handleUpdate(slot.id, payload)}
                  isSubmitting={updateMutation.isPending}
                />
              ))
            ) : (
              <p className="text-sm text-gray-500">No availability slots yet. Add your first slot below.</p>
            )}
            {(showAddForm || !provider.providerAvailability?.length) && (
              <AddSlotForm
                onSubmit={handleAddSlot}
                onCancel={() => setShowAddForm(false)}
                showCancel={!!provider.providerAvailability?.length}
                isSubmitting={createMutation.isPending}
              />
            )}
            {provider.providerAvailability?.length && !showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:border-primary-400 hover:text-primary-600"
              >
                + Add slot
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Time off</h2>
          <p className="mt-1 text-sm text-gray-500">
            Block specific dates when the provider is unavailable.
          </p>
        </CardHeader>
        <CardContent>
          {showUnavailabilityForm ? (
            <AddUnavailabilityForm
              onSubmit={async (payload: { date: string; startTime?: string; endTime?: string; reason?: string }) => {
                await unavailabilityMutation.mutateAsync(payload);
                queryClient.invalidateQueries({ queryKey: ['provider', providerId] });
                setShowUnavailabilityForm(false);
                setToast('Time off added.');
              }}
              onCancel={() => setShowUnavailabilityForm(false)}
              isSubmitting={unavailabilityMutation.isPending}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowUnavailabilityForm(true)}
              className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:border-primary-400 hover:text-primary-600"
            >
              + Add time off
            </button>
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

function AddUnavailabilityForm({
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  onSubmit: (payload: { date: string; startTime?: string; endTime?: string; reason?: string }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      reason: reason.trim() || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-4 rounded-lg border border-primary-200 bg-primary-50/30 p-4 sm:flex-nowrap"
    >
      <div className="w-full min-w-0 sm:w-36">
        <label className="block text-xs font-medium text-gray-500">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="w-full min-w-0 sm:w-28">
        <label className="block text-xs font-medium text-gray-500">Start (optional)</label>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="w-full min-w-0 sm:w-28">
        <label className="block text-xs font-medium text-gray-500">End (optional)</label>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="min-w-0 flex-1 sm:w-40">
        <label className="block text-xs font-medium text-gray-500">Reason (optional)</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Vacation"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Adding...' : 'Add'}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>
    </form>
  );
}

function AddSlotForm({
  onSubmit,
  onCancel,
  showCancel,
  isSubmitting,
}: {
  onSubmit: (payload: { weekday: number; startTime: string; endTime: string }) => void;
  onCancel: () => void;
  showCancel: boolean;
  isSubmitting: boolean;
}) {
  const [date, setDate] = useState(getNextDateForWeekday(1));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const weekday = getDateWeekday(date);
  const isValidWindow = getMinutesBetweenTimes(startTime, endTime) >= MIN_SLOT_MINUTES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidWindow) return;
    onSubmit({ weekday, startTime, endTime });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-4 rounded-lg border border-primary-200 bg-primary-50/30 p-4 sm:flex-nowrap"
    >
      <div className="w-full min-w-0 sm:w-40">
        <label className="block text-xs font-medium text-gray-500">Date</label>
        <input
          type="date"
          value={date}
          min={getTodayDateValue()}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">Applies every {WEEKDAY_NAMES[weekday]}.</p>
      </div>
      <div className="w-full min-w-0 sm:w-28">
        <label className="block text-xs font-medium text-gray-500">Start</label>
        <input
          type="time"
          step={TIME_INPUT_STEP_SECONDS}
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="w-full min-w-0 sm:w-28">
        <label className="block text-xs font-medium text-gray-500">End</label>
        <input
          type="time"
          step={TIME_INPUT_STEP_SECONDS}
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting || !isValidWindow}
        className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Adding...' : 'Add slot'}
      </button>
      {showCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      )}
    </form>
  );
}

function AvailabilityRow({
  slot,
  onUpdate,
  isSubmitting,
}: {
  slot: ProviderAvailabilitySlot;
  onUpdate: (payload: UpdateAvailabilityPayload) => void;
  isSubmitting: boolean;
}) {
  const [date, setDate] = useState(getNextDateForWeekday(slot.weekday));
  const [startTime, setStartTime] = useState(slot.startTime);
  const [endTime, setEndTime] = useState(slot.endTime);
  const weekday = getDateWeekday(date);
  const isValidWindow = getMinutesBetweenTimes(startTime, endTime) >= MIN_SLOT_MINUTES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidWindow) return;
    onUpdate({
      weekday,
      startTime,
      endTime,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-gray-50/50 p-4 sm:flex-nowrap"
    >
      <div className="w-full min-w-0 sm:w-40">
        <label className="block text-xs font-medium text-gray-500">Date</label>
        <input
          type="date"
          value={date}
          min={getTodayDateValue()}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">Recurring every {WEEKDAY_NAMES[weekday]}.</p>
      </div>
      <div className="w-full min-w-0 sm:w-28">
        <label className="block text-xs font-medium text-gray-500">Start</label>
        <input
          type="time"
          step={TIME_INPUT_STEP_SECONDS}
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="w-full min-w-0 sm:w-28">
        <label className="block text-xs font-medium text-gray-500">End</label>
        <input
          type="time"
          step={TIME_INPUT_STEP_SECONDS}
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting || !isValidWindow}
        className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Updating...' : 'Update'}
      </button>
    </form>
  );
}
