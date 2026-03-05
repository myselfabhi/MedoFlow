'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getDashboardServices,
  createService,
  updateService,
  archiveService,
  type DashboardService,
  type CreateServicePayload,
} from '@/lib/serviceApi';
import { getDisciplines } from '@/lib/disciplineApi';
import { useAuth } from '@/contexts/AuthContext';
import { useSelectedClinicId } from '@/contexts/ClinicContext';
import { useAppToast } from '@/hooks/useAppToast';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  duration: z.coerce.number().min(1, 'Duration must be at least 1'),
  defaultPrice: z.string().min(1, 'Price is required'),
  disciplineId: z.string().min(1, 'Discipline is required'),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

function ServiceForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
  disciplines,
}: {
  defaultValues?: Partial<ServiceFormData>;
  onSubmit: (data: ServiceFormData) => void;
  isSubmitting: boolean;
  submitLabel: string;
  disciplines: { id: string; name: string }[];
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: defaultValues || {
      name: '',
      duration: 30,
      defaultPrice: '',
      disciplineId: '',
    },
  });

  const disciplineId = watch('disciplineId');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <Input
          className="mt-1"
          {...register('name')}
          placeholder="e.g. Initial Consultation"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Discipline
        </label>
        <Select
          value={disciplineId}
          onValueChange={(v) => setValue('disciplineId', v, { shouldValidate: true })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select discipline" />
          </SelectTrigger>
          <SelectContent>
            {disciplines.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.disciplineId && (
          <p className="mt-1 text-sm text-red-600">{errors.disciplineId.message}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Duration (min)
          </label>
          <Input
            type="number"
            min={1}
            className="mt-1"
            {...register('duration')}
          />
          {errors.duration && (
            <p className="mt-1 text-sm text-red-600">{errors.duration.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Default Price
          </label>
          <Input
            type="text"
            className="mt-1"
            placeholder="0.00"
            {...register('defaultPrice')}
          />
          {errors.defaultPrice && (
            <p className="mt-1 text-sm text-red-600">{errors.defaultPrice.message}</p>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function ServicesPage() {
  const { user } = useAuth();
  const clinicId = useSelectedClinicId();

  if (user?.role === 'PATIENT') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Services</h1>
        <p className="text-gray-500">
          Service management is available to clinic staff. Contact your clinic for
          more information.
        </p>
      </div>
    );
  }
  const effectiveClinicId = clinicId ?? user?.clinicId ?? undefined;
  const toast = useAppToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<DashboardService | null>(null);

  const canEdit =
    user?.role === 'CLINIC_ADMIN' || user?.role === 'SUPER_ADMIN';

  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ['services', effectiveClinicId],
    queryFn: () => getDashboardServices(effectiveClinicId),
    enabled: !!effectiveClinicId,
  });

  const { data: disciplines = [] } = useQuery({
    queryKey: ['disciplines', effectiveClinicId],
    queryFn: () => getDisciplines(effectiveClinicId),
    enabled: !!effectiveClinicId && (addOpen || editOpen),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateServicePayload) =>
      createService(data, user?.role === 'SUPER_ADMIN' ? effectiveClinicId : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setAddOpen(false);
      toast.success('Service created');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message ?? 'Failed to create service');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; duration?: number; defaultPrice?: string; disciplineId?: string };
    }) =>
      updateService(
        id,
        data,
        user?.role === 'SUPER_ADMIN' ? effectiveClinicId : undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setEditOpen(false);
      setEditing(null);
      toast.success('Service updated');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message ?? 'Failed to update service');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) =>
      archiveService(id, user?.role === 'SUPER_ADMIN' ? effectiveClinicId : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service archived');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message ?? 'Failed to archive service');
    },
  });

  const handleAddSubmit = (data: ServiceFormData) => {
    createMutation.mutate({
      name: data.name,
      duration: data.duration,
      defaultPrice: data.defaultPrice,
      disciplineId: data.disciplineId,
    });
  };

  const handleEditSubmit = (data: ServiceFormData) => {
    if (!editing) return;
    updateMutation.mutate({
      id: editing.id,
      data: {
        name: data.name,
        duration: data.duration,
        defaultPrice: data.defaultPrice,
        disciplineId: data.disciplineId,
      },
    });
  };

  const handleArchive = (id: string) => {
    if (confirm('Archive this service? It will no longer be available for booking.')) {
      archiveMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Services</h1>
          <p className="mt-1 text-sm text-gray-500">Manage clinic services</p>
        </div>
        {canEdit && (
          <Button onClick={() => setAddOpen(true)}>Add Service</Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">All Services</h2>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Failed to load services.
            </div>
          )}

          {!isLoading && !error && services.length === 0 && (
            <EmptyState
              title="No services yet"
              description="Add services to offer to patients."
              actionLabel={canEdit ? 'Add Service' : undefined}
              onAction={canEdit ? () => setAddOpen(true) : undefined}
            />
          )}

          {!isLoading && !error && services.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Discipline
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Price
                    </th>
                    {canEdit && (
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {services.map((s) => (
                    <tr key={s.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {s.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {s.discipline.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {s.duration} min
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        ${s.defaultPrice}
                      </td>
                      {canEdit && (
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditing(s);
                              setEditOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleArchive(s.id)}
                            disabled={archiveMutation.isPending}
                          >
                            Archive
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Service</DialogTitle>
          </DialogHeader>
          <ServiceForm
            disciplines={disciplines}
            onSubmit={handleAddSubmit}
            isSubmitting={createMutation.isPending}
            submitLabel="Create"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          {editing && (
            <ServiceForm
              defaultValues={{
                name: editing.name,
                duration: editing.duration,
                defaultPrice: editing.defaultPrice,
                disciplineId: editing.discipline.id,
              }}
              disciplines={disciplines}
              onSubmit={handleEditSubmit}
              isSubmitting={updateMutation.isPending}
              submitLabel="Save"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
