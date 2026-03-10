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
  AppModal,
  AppTable,
  type AppTableColumn,
} from '@/components/ui-system';
import { Skeleton } from '@/components/ui/skeleton';

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
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Name
        </label>
        <AppInput
          id="name"
          type="text"
          className="mt-1"
          {...register('name')}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-danger">{errors.name.message}</p>
        )}
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          {...register('description')}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-danger">
            {errors.description.message}
          </p>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <AppButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </AppButton>
      </div>
    </form>
  );
}

export default function DisciplinesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useAppToast();
  const { showModal } = useSystemModal();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null);

  const clinicId = user?.clinicId ?? undefined;

  const { data: disciplines, isLoading, error } = useQuery({
    queryKey: ['disciplines'],
    queryFn: getDisciplines,
    enabled: !!clinicId,
  });

  const createMutation = useMutation({
    mutationFn: createDiscipline,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplines'] });
      setAddModalOpen(false);
      toast.success('Discipline created successfully');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; description?: string };
    }) => updateDiscipline(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplines'] });
      setEditModalOpen(false);
      setEditingDiscipline(null);
      toast.success('Discipline updated successfully');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDiscipline,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplines'] });
      toast.success('Discipline deleted successfully');
    },
  });

  const handleAddSubmit = (data: DisciplineFormData) => {
    createMutation.mutate({ name: data.name, description: data.description });
  };

  const handleEditSubmit = (data: DisciplineFormData) => {
    if (!editingDiscipline) return;
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

  if (!clinicId) {
    return (
      <div className="space-y-6">
        <AppPageHeader title="Disciplines" description="Manage disciplines" />
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
        title="Disciplines"
        description="Manage disciplines"
        actions={
          <AppButton onClick={() => setAddModalOpen(true)}>
            Add Discipline
          </AppButton>
        }
      />

      <AppCard>
        <AppCardHeader>
          <h2 className="text-lg font-semibold text-slate-900">All Disciplines</h2>
        </AppCardHeader>
        <AppCardContent>
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
              Failed to load disciplines. Please try again.
            </div>
          )}

          {!isLoading && !error && (!disciplines || disciplines.length === 0) && (
            <AppEmptyState
              title="No disciplines created yet"
              description="Add disciplines to organize your services."
              actionLabel="Add Discipline"
              onAction={() => setAddModalOpen(true)}
            />
          )}

          {!isLoading && !error && disciplines && disciplines.length > 0 && (
            <AppTable<Discipline>
              columns={[
                {
                  key: 'name',
                  header: 'Name',
                  render: (d) => (
                    <span className="font-medium text-slate-900">{d.name}</span>
                  ),
                },
                {
                  key: 'description',
                  header: 'Description',
                  render: (d) => (
                    <span className="text-slate-600">{d.description || '—'}</span>
                  ),
                },
                {
                  key: 'created',
                  header: 'Created',
                  render: (d) => (
                    <span className="text-slate-600">
                      {formatDate(d.createdAt)}
                    </span>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  className: 'text-right',
                  render: (d) => (
                    <div className="flex justify-end gap-2">
                      <AppButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(d)}
                      >
                        Edit
                      </AppButton>
                      <AppButton
                        variant="ghost"
                        size="sm"
                        className="text-danger hover:bg-danger/10"
                        onClick={() => handleDeleteClick(d.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </AppButton>
                    </div>
                  ),
                },
              ]}
              data={disciplines}
              keyExtractor={(d) => d.id}
            />
          )}
        </AppCardContent>
      </AppCard>

      <AppModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        title="Add Discipline"
        content={
          <DisciplineForm
            onSubmit={handleAddSubmit}
            isSubmitting={createMutation.isPending}
            submitLabel="Create"
          />
        }
      />

      <AppModal
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setEditingDiscipline(null);
        }}
        title="Edit Discipline"
        content={
          editingDiscipline ? (
            <DisciplineForm
              defaultValues={{
                name: editingDiscipline.name,
                description: editingDiscipline.description ?? '',
              }}
              onSubmit={handleEditSubmit}
              isSubmitting={updateMutation.isPending}
              submitLabel="Save"
            />
          ) : null
        }
      />
    </div>
  );
}
