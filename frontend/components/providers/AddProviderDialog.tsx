'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { getDisciplines } from '@/lib/disciplineApi';
import { getDashboardServices, type DashboardService } from '@/lib/serviceApi';
import { addProvider, type AddProviderPayload } from '@/lib/availabilityApi';
import { useAppToast } from '@/hooks/useAppToast';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const addProviderSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Valid email is required.').email('Valid email is required.'),
  disciplineIds: z.array(z.string()).min(1, 'Select at least one discipline'),
  serviceIds: z.array(z.string()).min(1, 'Select at least one service'),
  priceOverrides: z.record(z.string(), z.union([z.number(), z.undefined()])).optional(),
});

type AddProviderFormData = z.infer<typeof addProviderSchema>;

interface AddProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProviderDialog({ open, onOpenChange }: AddProviderDialogProps) {
  const { user } = useAuth();
  const clinicId = user?.clinicId?.trim() || undefined;
  const queryClient = useQueryClient();
  const toast = useAppToast();

  const { data: disciplines = [], isLoading: disciplinesLoading } = useQuery({
    queryKey: ['disciplines'],
    queryFn: () => getDisciplines(),
    enabled: !!clinicId && open,
  });

  const { data: allServices = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => getDashboardServices(),
    enabled: !!clinicId && open,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddProviderFormData>({
    resolver: zodResolver(addProviderSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      disciplineIds: [],
      serviceIds: [],
      priceOverrides: {},
    },
  });

  const selectedDisciplineIds = watch('disciplineIds') ?? [];
  const selectedServiceIds = watch('serviceIds') ?? [];
  const priceOverrides = watch('priceOverrides') ?? {};

  const filteredServices = useMemo(() => {
    if (selectedDisciplineIds.length === 0) return [];
    const idSet = new Set(selectedDisciplineIds);
    return allServices.filter((s) => idSet.has(s.discipline.id));
  }, [allServices, selectedDisciplineIds]);

  useEffect(() => {
    if (!open) return;
    setValue('serviceIds', []);
    setValue('priceOverrides', {});
  }, [selectedDisciplineIds, open, setValue]);

  const toggleDiscipline = (disciplineId: string) => {
    const current = selectedDisciplineIds;
    const next = current.includes(disciplineId)
      ? current.filter((id) => id !== disciplineId)
      : [...current, disciplineId];
    setValue('disciplineIds', next, { shouldValidate: true });
  };

  const toggleService = (serviceId: string) => {
    const current = selectedServiceIds;
    const next = current.includes(serviceId)
      ? current.filter((id) => id !== serviceId)
      : [...current, serviceId];
    setValue('serviceIds', next, { shouldValidate: true });
  };

  const setPriceOverride = (serviceId: string, value: string) => {
    const num = value === '' ? undefined : parseFloat(value);
    setValue('priceOverrides', {
      ...priceOverrides,
      [serviceId]: num ?? undefined,
    });
  };

  const addProviderMutation = useMutation({
    mutationFn: (payload: AddProviderPayload) =>
      addProvider(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      toast.success('Provider created successfully');
      onOpenChange(false);
      reset();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create provider');
    },
  });

  const onSubmit = (data: AddProviderFormData) => {
    if (!clinicId) return;
    const services = data.serviceIds.map((serviceId) => {
      const override = data.priceOverrides?.[serviceId];
      return {
        serviceId,
        priceOverride:
          override !== undefined && !Number.isNaN(override) ? override : undefined,
      };
    });
    addProviderMutation.mutate({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      disciplineIds: data.disciplineIds,
      services,
    });
  };

  const isSubmittingForm = isSubmitting || addProviderMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Provider</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">
              Provider Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  First Name
                </label>
                <Input
                  {...register('firstName')}
                  placeholder="John"
                  className={cn(errors.firstName && 'border-red-500')}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-600">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <Input
                  {...register('lastName')}
                  placeholder="Doe"
                  className={cn(errors.lastName && 'border-red-500')}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Email (required)
              </label>
              <Input
                {...register('email')}
                type="email"
                placeholder="john@example.com"
                className={cn(errors.email && 'border-red-500')}
              />
              <p className="text-xs text-gray-500">
                This email will be used for provider login.
              </p>
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Disciplines</h4>
            {disciplinesLoading ? (
              <p className="text-sm text-gray-500">Loading disciplines...</p>
            ) : disciplines.length === 0 ? (
              <p className="text-sm text-gray-500">No disciplines found.</p>
            ) : (
              <ScrollArea className="h-[120px] rounded-md border border-gray-200 p-3">
                <div className="space-y-2">
                  {disciplines.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center space-x-2 rounded-md p-2 hover:bg-gray-50"
                    >
                      <Checkbox
                        id={`discipline-${d.id}`}
                        checked={selectedDisciplineIds.includes(d.id)}
                        onCheckedChange={() => toggleDiscipline(d.id)}
                      />
                      <label
                        htmlFor={`discipline-${d.id}`}
                        className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {d.name}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            {errors.disciplineIds && (
              <p className="text-xs text-red-600">{errors.disciplineIds.message}</p>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">
              Services Offered
            </h4>
            {selectedDisciplineIds.length === 0 ? (
              <p className="text-sm text-gray-500">
                Select at least one discipline to see available services.
              </p>
            ) : servicesLoading ? (
              <p className="text-sm text-gray-500">Loading services...</p>
            ) : filteredServices.length === 0 ? (
              <p className="text-sm text-gray-500">
                No services found for selected disciplines.
              </p>
            ) : (
              <ScrollArea className="h-[180px] rounded-md border border-gray-200 p-3">
                <div className="space-y-3">
                  {filteredServices.map((svc) => (
                    <ServiceRow
                      key={svc.id}
                      service={svc}
                      selected={selectedServiceIds.includes(svc.id)}
                      onToggle={() => toggleService(svc.id)}
                      priceOverride={priceOverrides[svc.id]}
                      onPriceChange={(v) => setPriceOverride(svc.id, v)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
            {errors.serviceIds && (
              <p className="text-xs text-red-600">{errors.serviceIds.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmittingForm}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmittingForm}>
              {isSubmittingForm ? 'Creating...' : 'Create Provider'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ServiceRow({
  service,
  selected,
  onToggle,
  priceOverride,
  onPriceChange,
}: {
  service: DashboardService;
  selected: boolean;
  onToggle: () => void;
  priceOverride?: number;
  onPriceChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-gray-100 bg-gray-50/50 p-2">
      <Checkbox
        id={`service-${service.id}`}
        checked={selected}
        onCheckedChange={onToggle}
      />
      <div className="min-w-0 flex-1">
        <label
          htmlFor={`service-${service.id}`}
          className="cursor-pointer text-sm font-medium text-gray-900"
        >
          {service.name}
        </label>
        <p className="text-xs text-gray-500">
          {service.duration} min · ${service.defaultPrice} default
        </p>
      </div>
      <div className="w-24 shrink-0">
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="Override"
          value={selected && priceOverride !== undefined ? String(priceOverride) : ''}
          onChange={(e) => onPriceChange(e.target.value)}
          disabled={!selected}
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}
