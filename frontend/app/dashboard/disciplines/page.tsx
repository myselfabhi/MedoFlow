'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getDisciplines,
  createDiscipline,
  updateDiscipline,
  deleteDiscipline,
  type Discipline,
  type DisciplineCreatePayload,
} from '@/lib/disciplineApi';
import { useAuth } from '@/contexts/AuthContext';
import { useClinic } from '@/contexts/ClinicContext';
import { useClinicGuard } from '@/hooks/useClinicGuard';
import { useAppToast } from '@/hooks/useAppToast';
import { useSystemModal } from '@/hooks/useSystemModal';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/common/EmptyState';

const disciplineSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

type DisciplineFormData = z.infer<typeof disciplineSchema>;

function DisciplineForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
}: {
  defaultValues?: DisciplineFormData;
  onSubmit: (data: DisciplineFormData) => void;
  isSubmitting: boolean;
  submitLabel: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DisciplineFormData>({
    resolver: zodResolver(disciplineSchema),
    defaultValues: defaultValues || { name: '', description: '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          id="name"
          type="text"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          {...register('name')}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          {...register('description')}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 border-b border-gray-200 pb-3">
          <div className="h-4 flex-1 rounded bg-gray-200" />
          <div className="h-4 flex-1 rounded bg-gray-200" />
          <div className="h-4 w-24 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

export default function DisciplinesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { clinicId, ensureClinicSelected } = useClinicGuard();
  const toast = useAppToast();
  const { showModal } = useSystemModal();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null);

  const effectiveClinicId = clinicId ?? user?.clinicId ?? undefined;
  const { clinics } = useClinic();
  const hasNoClinics = user?.role === 'SUPER_ADMIN' && clinics.length === 0;

  const { data: disciplines, isLoading, error } = useQuery({
    queryKey: ['disciplines', effectiveClinicId],
    queryFn: () => getDisciplines(effectiveClinicId ?? undefined),
    enabled: !!effectiveClinicId,
  });

  const createMutation = useMutation({
    mutationFn: (data: DisciplineCreatePayload) =>
      createDiscipline(data, effectiveClinicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplines'] });
      setAddModalOpen(false);
      toast.success('Discipline created successfully');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) =>
      updateDiscipline(id, data, effectiveClinicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplines'] });
      setEditModalOpen(false);
      setEditingDiscipline(null);
      toast.success('Discipline updated successfully');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDiscipline(id, effectiveClinicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplines'] });
      toast.success('Discipline deleted successfully');
    },
  });

  const handleAddSubmit = (data: DisciplineFormData) => {
    if (!ensureClinicSelected()) return;
    createMutation.mutate({ name: data.name, description: data.description });
  };

  const handleEditSubmit = (data: DisciplineFormData) => {
    if (!editingDiscipline) return;
    if (!ensureClinicSelected()) return;
    updateMutation.mutate({
      id: editingDiscipline.id,
      data: { name: data.name, description: data.description },
    });
  };

  const handleEditClick = (discipline: Discipline) => {
    setEditingDiscipline(discipline);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    showModal({
      title: 'Delete Discipline',
      description: 'Are you sure you want to delete this discipline?',
      actionLabel: 'Delete',
      onAction: () => deleteMutation.mutate(id),
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!effectiveClinicId && user?.role === 'SUPER_ADMIN') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Disciplines</h1>
        <EmptyState
          title={hasNoClinics ? 'Oops! No Clinics Found' : 'No clinic selected'}
          description={
            hasNoClinics
              ? "You haven't created any clinics yet. Create a clinic to begin setting up providers and services."
              : 'Select a clinic from the top-right to manage disciplines and services.'
          }
          actionLabel={hasNoClinics ? 'Create Clinic' : undefined}
          onAction={hasNoClinics ? () => (window.location.href = '/dashboard/clinics/new') : undefined}
        />
      </div>
    );
  }

  if (!effectiveClinicId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Disciplines</h1>
        <EmptyState
          title="No clinic assigned"
          description="You are not assigned to a clinic. Contact your administrator."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Disciplines</h1>
          <p className="mt-1 text-sm text-gray-500">Manage disciplines</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!ensureClinicSelected()) return;
            setAddModalOpen(true);
          }}
          className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Add Discipline
        </button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">All Disciplines</h2>
        </CardHeader>
        <CardContent>
          {isLoading && <TableSkeleton />}

          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
              Failed to load disciplines. Please try again.
            </div>
          )}

          {!isLoading && !error && (!disciplines || disciplines.length === 0) && (
            <EmptyState
              title="No disciplines created yet"
              description="Add disciplines to organize your services."
              actionLabel="Add Discipline"
              onAction={() => setAddModalOpen(true)}
            />
          )}

          {!isLoading && !error && disciplines && disciplines.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {disciplines.map((d) => (
                    <tr key={d.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {d.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {d.description || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {formatDate(d.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                        <button
                          type="button"
                          onClick={() => handleEditClick(d)}
                          className="rounded-md px-2 py-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(d.id)}
                          disabled={deleteMutation.isPending}
                          className="ml-2 rounded-md px-2 py-1 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Discipline"
      >
        <DisciplineForm
          onSubmit={handleAddSubmit}
          isSubmitting={createMutation.isPending}
          submitLabel="Create"
        />
      </Modal>

      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingDiscipline(null);
        }}
        title="Edit Discipline"
      >
        {editingDiscipline && (
          <DisciplineForm
            defaultValues={{
              name: editingDiscipline.name,
              description: editingDiscipline.description ?? '',
            }}
            onSubmit={handleEditSubmit}
            isSubmitting={updateMutation.isPending}
            submitLabel="Save"
          />
        )}
      </Modal>
    </div>
  );
}
