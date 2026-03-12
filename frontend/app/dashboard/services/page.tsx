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
  type UpdateServicePayload,
} from '@/lib/serviceApi';
import { getDisciplines } from '@/lib/disciplineApi';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAppToast } from '@/hooks/useAppToast';
import { useSystemModal } from '@/hooks/useSystemModal';
import {
  AppCard,
  AppCardHeader,
  AppCardContent,
  AppButton,
  AppInput,
  AppPageHeader,
  AppEmptyState,
  AppTable,
  type AppTableColumn,
} from '@/components/ui-system';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  duration: z.coerce.number().min(1, 'Duration must be at least 1'),
  defaultPrice: z.string().min(1, 'Price is required'),
  disciplineId: z.string().min(1, 'Discipline is required'),
  recommendedProductIds: z.array(z.string()).optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

function ServiceForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
  disciplines,
  products,
}: {
  defaultValues?: Partial<ServiceFormData>;
  onSubmit: (data: ServiceFormData) => void;
  isSubmitting: boolean;
  submitLabel: string;
  disciplines: { id: string; name: string }[];
  products: { id: string; name: string }[];
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
      recommendedProductIds: [],
    },
  });

  const disciplineId = watch('disciplineId');
  const selectedProductIds = watch('recommendedProductIds') || [];

  const toggleProduct = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      setValue('recommendedProductIds', selectedProductIds.filter(id => id !== productId));
    } else {
      setValue('recommendedProductIds', [...selectedProductIds, productId]);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Name</label>
        <AppInput
          className="mt-1"
          {...register('name')}
          placeholder="e.g. Initial Consultation"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-danger">{errors.name.message}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Discipline
        </label>
        <Select
          value={disciplineId}
          onValueChange={(v) =>
            setValue('disciplineId', v, { shouldValidate: true })
          }
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
          <p className="mt-1 text-sm text-danger">
            {errors.disciplineId.message}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Duration (min)
          </label>
          <AppInput
            type="number"
            min={1}
            className="mt-1"
            {...register('duration')}
          />
          {errors.duration && (
            <p className="mt-1 text-sm text-danger">
              {errors.duration.message}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Default Price
          </label>
          <AppInput
            type="text"
            className="mt-1"
            placeholder="0.00"
            {...register('defaultPrice')}
          />
          {errors.defaultPrice && (
            <p className="mt-1 text-sm text-danger">
              {errors.defaultPrice.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Recommended Products
        </label>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md bg-white">
          {products.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-50 rounded"
            >
              <input
                type="checkbox"
                checked={selectedProductIds.includes(p.id)}
                onChange={() => toggleProduct(p.id)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm truncate">{p.name}</span>
            </label>
          ))}
          {products.length === 0 && (
            <p className="col-span-2 text-center text-xs text-muted-foreground py-4">
              No products found
            </p>
          )}
        </div>
      </div>

      <DialogFooter>
        <AppButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </AppButton>
      </DialogFooter>
    </form>
  );
}

export default function ServicesPage() {
  const { user } = useAuth();
  const { showModal } = useSystemModal();
  const toast = useAppToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<DashboardService | null>(null);

  const clinicId = user?.clinicId ?? undefined;
  const canEdit = user?.role === 'SUPER_ADMIN';

  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: () => getDashboardServices(),
    enabled: !!clinicId,
  });

  const { data: disciplines = [] } = useQuery({
    queryKey: ['disciplines'],
    queryFn: () => getDisciplines(),
    enabled: !!clinicId,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data.data.products;
    },
    enabled: !!clinicId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateServicePayload) => createService(data),
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
      data: UpdateServicePayload;
    }) => updateService(id, data),
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
    mutationFn: (id: string) => archiveService(id),
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
      recommendedProductIds: data.recommendedProductIds,
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
        recommendedProductIds: data.recommendedProductIds,
      },
    });
  };

  const handleArchive = (id: string) => {
    showModal({
      title: 'Archive Service',
      description:
        'Archive this service? It will no longer be available for booking.',
      actionLabel: 'Archive',
      onAction: () => archiveMutation.mutate(id),
    });
  };

  if (user?.role === 'PATIENT') {
    return (
      <div className="space-y-6">
        <AppPageHeader title="Services" description="Manage clinic services" />
        <p className="text-sm text-slate-600">
          Service management is available to clinic staff. Contact your clinic
          for more information.
        </p>
      </div>
    );
  }

  if (!clinicId) {
    return (
      <div className="space-y-6">
        <AppPageHeader title="Services" description="Manage clinic services" />
        <AppEmptyState
          title="No clinic assigned"
          description="You are not assigned to a clinic. Contact your administrator."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AppPageHeader
        title="Services"
        description="Manage clinic services"
        actions={
          canEdit ? (
            <AppButton onClick={() => setAddOpen(true)}>Add Service</AppButton>
          ) : undefined
        }
      />

      <AppCard>
        <AppCardHeader>
          <h2 className="text-lg font-semibold text-slate-900">All Services</h2>
        </AppCardHeader>
        <AppCardContent>
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
              Failed to load services.
            </div>
          )}

          {!isLoading && !error && services.length === 0 && (
            <AppEmptyState
              title="No services yet"
              description="Create services under disciplines."
              actionLabel={canEdit ? 'Add Service' : undefined}
              onAction={canEdit ? () => setAddOpen(true) : undefined}
            />
          )}

          {!isLoading && !error && services.length > 0 && (
            <AppTable<DashboardService>
              columns={[
                {
                  key: 'name',
                  header: 'Name',
                  render: (s) => (
                    <span className="font-medium text-slate-900">{s.name}</span>
                  ),
                },
                {
                  key: 'discipline',
                  header: 'Discipline',
                  render: (s) => (
                    <span className="text-slate-600">{s.discipline.name}</span>
                  ),
                },
                {
                  key: 'duration',
                  header: 'Duration',
                  render: (s) => (
                    <span className="text-slate-600">{s.duration} min</span>
                  ),
                },
                {
                  key: 'price',
                  header: 'Price',
                  render: (s) => (
                    <span className="text-slate-600">${s.defaultPrice}</span>
                  ),
                },
                ...(canEdit
                  ? [
                      {
                        key: 'actions',
                        header: 'Actions',
                        className: 'text-right',
                        render: (s: DashboardService) => (
                          <div className="flex justify-end gap-2">
                            <AppButton
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditing(s);
                                setEditOpen(true);
                              }}
                            >
                              Edit
                            </AppButton>
                            <AppButton
                              variant="ghost"
                              size="sm"
                              className="text-danger hover:bg-danger/10"
                              onClick={() => handleArchive(s.id)}
                              disabled={archiveMutation.isPending}
                            >
                              Archive
                            </AppButton>
                          </div>
                        ),
                      },
                    ]
                  : []),
              ]}
              data={services}
              keyExtractor={(s) => s.id}
            />
          )}
        </AppCardContent>
      </AppCard>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-[var(--radius)]">
          <DialogHeader>
            <DialogTitle>Add Service</DialogTitle>
          </DialogHeader>
          <ServiceForm
            disciplines={disciplines}
            products={products}
            onSubmit={handleAddSubmit}
            isSubmitting={createMutation.isPending}
            submitLabel="Create"
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="rounded-[var(--radius)]">
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
                recommendedProductIds: editing.recommendedProducts?.map(p => p.id) || [],
              }}
              disciplines={disciplines}
              products={products}
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
