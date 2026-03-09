'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listProviderServices,
  addProviderService,
  updateProviderService,
  removeProviderService,
  type ProviderServiceItem,
} from '@/lib/availabilityApi';
import { getDashboardServices } from '@/lib/serviceApi';
import { useAppToast } from '@/hooks/useAppToast';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

interface ProviderServicesCardProps {
  providerId: string;
  clinicId: string;
}

export function ProviderServicesCard({ providerId, clinicId }: ProviderServicesCardProps) {
  const queryClient = useQueryClient();
  const toast = useAppToast();
  const [addServiceId, setAddServiceId] = useState('');
  const [addPrice, setAddPrice] = useState('');

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['provider-services', providerId, clinicId],
    queryFn: () => listProviderServices(providerId, clinicId),
    enabled: !!providerId && !!clinicId,
  });

  const { data: allServices = [] } = useQuery({
    queryKey: ['services', clinicId],
    queryFn: () => getDashboardServices(clinicId),
    enabled: !!clinicId,
  });

  const assignedServiceIds = new Set(services.map((s) => s.serviceId));
  const availableToAdd = allServices.filter((s) => !assignedServiceIds.has(s.id));

  const addMutation = useMutation({
    mutationFn: (payload: { serviceId: string; priceOverride?: number }) =>
      addProviderService(providerId, payload.serviceId, clinicId, payload.priceOverride),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-services', providerId] });
      queryClient.invalidateQueries({ queryKey: ['provider', providerId] });
      setAddServiceId('');
      setAddPrice('');
      toast.success('Service added');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message ?? 'Failed to add service');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ serviceId, priceOverride }: { serviceId: string; priceOverride: number | null }) =>
      updateProviderService(providerId, serviceId, priceOverride, clinicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-services', providerId] });
      queryClient.invalidateQueries({ queryKey: ['provider', providerId] });
      toast.success('Price updated');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message ?? 'Failed to update');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (serviceId: string) => removeProviderService(providerId, serviceId, clinicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-services', providerId] });
      queryClient.invalidateQueries({ queryKey: ['provider', providerId] });
      toast.success('Service removed');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message ?? 'Failed to remove service');
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addServiceId) return;
    const price = addPrice ? parseFloat(addPrice) : undefined;
    if (addPrice && (price === undefined || Number.isNaN(price) || price < 0)) {
      toast.error('Invalid price');
      return;
    }
    addMutation.mutate({ serviceId: addServiceId, priceOverride: price });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Services</h2>
        </CardHeader>
        <CardContent>
          <div className="h-24 animate-pulse rounded bg-gray-100" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-medium text-gray-900">Services</h2>
        <p className="mt-1 text-sm text-gray-500">
          Services this provider offers. At least one service is required.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {services.length > 0 && (
          <ul className="space-y-3">
            {services.map((ps) => (
              <ProviderServiceRow
                key={ps.id}
                item={ps}
                onUpdate={(priceOverride) =>
                  updateMutation.mutate({ serviceId: ps.serviceId, priceOverride })
                }
                onRemove={() => removeMutation.mutate(ps.serviceId)}
                canRemove={services.length > 1}
                isUpdating={updateMutation.isPending}
                isRemoving={removeMutation.isPending}
              />
            ))}
          </ul>
        )}
        {availableToAdd.length > 0 && (
          <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-4">
            <div className="min-w-0 flex-1 sm:w-48">
              <label className="block text-xs font-medium text-gray-500">Add service</label>
              <select
                value={addServiceId}
                onChange={(e) => setAddServiceId(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select service</option>
                {availableToAdd.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (${s.defaultPrice})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-gray-500">Price override</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Default"
                value={addPrice}
                onChange={(e) => setAddPrice(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={!addServiceId || addMutation.isPending}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {addMutation.isPending ? 'Adding...' : 'Add'}
            </button>
          </form>
        )}
        {services.length === 0 && availableToAdd.length === 0 && (
          <p className="text-sm text-gray-500">No services available to add. Create services in the Services section first.</p>
        )}
      </CardContent>
    </Card>
  );
}

function ProviderServiceRow({
  item,
  onUpdate,
  onRemove,
  canRemove,
  isUpdating,
  isRemoving,
}: {
  item: ProviderServiceItem;
  onUpdate: (priceOverride: number | null) => void;
  onRemove: () => void;
  canRemove: boolean;
  isUpdating: boolean;
  isRemoving: boolean;
}) {
  const [priceOverride, setPriceOverride] = useState(
    item.priceOverride ? String(item.priceOverride) : ''
  );
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    const val = priceOverride.trim();
    const num = val === '' ? null : parseFloat(val);
    if (val !== '' && (isNaN(num!) || num! < 0)) return;
    onUpdate(num);
    setEditing(false);
  };

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:flex-nowrap">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900">{item.service.name}</p>
        <p className="text-xs text-gray-500">
          Default: ${item.service.defaultPrice}
          {item.service.discipline && ` • ${item.service.discipline.name}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <input
              type="number"
              step="0.01"
              min="0"
              value={priceOverride}
              onChange={(e) => setPriceOverride(e.target.value)}
              placeholder="Default"
              className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={isUpdating}
              className="rounded bg-primary-600 px-2 py-1 text-xs text-white hover:bg-primary-700"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setPriceOverride(item.priceOverride ? String(item.priceOverride) : '');
                setEditing(false);
              }}
              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <span className="text-sm text-gray-700">
              {item.priceOverride != null ? `$${item.priceOverride}` : `$${item.service.defaultPrice} (default)`}
            </span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              Edit
            </button>
          </>
        )}
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={isRemoving}
            className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>
    </li>
  );
}
