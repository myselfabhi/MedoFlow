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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getDisciplines } from '@/lib/disciplineApi';
import { getDashboardServices, type DashboardService } from '@/lib/serviceApi';
import { addProvider, type AddProviderPayload } from '@/lib/availabilityApi';
import { useAppToast } from '@/hooks/useAppToast';
import { useSelectedClinicId } from '@/contexts/ClinicContext';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const addProviderSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  disciplineId: z.string().min(1, 'Select at least one discipline'),
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
  const clinicId = useSelectedClinicId();
  const effectiveClinicId = (clinicId ?? user?.clinicId)?.trim() || undefined;
  const queryClient = useQueryClient();
  const toast = useAppToast();

  const { data: disciplines = [], isLoading: disciplinesLoading } = useQuery({
    queryKey: ['disciplines', effectiveClinicId],
    queryFn: () => getDisciplines(effectiveClinicId),
    enabled: !!effectiveClinicId && open,
  });

  const { data: allServices = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['services', effectiveClinicId],
    queryFn: () => getDashboardServices(effectiveClinicId),
    enabled: !!effectiveClinicId && open,
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
      disciplineId: '',
      serviceIds: [],
      priceOverrides: {},
    },
  });

  const selectedDisciplineId = watch('disciplineId');
  const selectedServiceIds = watch('serviceIds') ?? [];
  const priceOverrides = watch('priceOverrides') ?? {};

  const filteredServices = useMemo(() => {
    if (!selectedDisciplineId) return [];
    return allServices.filter(
      (s) => s.discipline.id === selectedDisciplineId
    );
  }, [allServices, selectedDisciplineId]);

  useEffect(() => {
    if (!open) return;
    setValue('serviceIds', []);
    setValue('priceOverrides', {});
  }, [selectedDisciplineId, open, setValue]);

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
      addProvider(payload, effectiveClinicId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers', effectiveClinicId] });
      toast.success('Provider created successfully');
      onOpenChange(false);
      reset();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create provider');
    },
  });

  const onSubmit = (data: AddProviderFormData) => {
    if (!effectiveClinicId) {
      toast.error('Please select a clinic first.');
      return;
    }
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
      email: data.email || undefined,
      disciplineId: data.disciplineId,
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
                Email (optional)
              </label>
              <Input
                {...register('email')}
                type="email"
                placeholder="john@example.com"
                className={cn(errors.email && 'border-red-500')}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">
              Discipline Assignment
            </h4>
            <div className="space-y-2">
              <Select
                value={selectedDisciplineId}
                onValueChange={(v) => setValue('disciplineId', v, { shouldValidate: true })}
                disabled={disciplinesLoading}
              >
                <SelectTrigger className={cn(errors.disciplineId && 'border-red-500')}>
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
                <p className="text-xs text-red-600">{errors.disciplineId.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">
              Services Offered
            </h4>
            {!selectedDisciplineId ? (
              <p className="text-sm text-gray-500">
                Select a discipline first to see available services.
              </p>
            ) : servicesLoading ? (
              <p className="text-sm text-gray-500">Loading services...</p>
            ) : filteredServices.length === 0 ? (
              <p className="text-sm text-gray-500">
                No services found for this discipline.
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
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        onClick={onToggle}
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded border border-gray-300 transition-colors',
          selected ? 'bg-primary border-primary' : 'bg-white'
        )}
      >
        {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{service.name}</p>
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
