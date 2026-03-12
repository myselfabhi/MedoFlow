'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { inviteStaff } from '@/lib/staffApi';
import { getDisciplines } from '@/lib/disciplineApi';
import { getDashboardServices } from '@/lib/serviceApi';
import { useAppToast } from '@/hooks/useAppToast';

const staffSchema = z.object({
  role: z.enum(['FRONT_DESK', 'PROVIDER']),
  name: z.string().optional(),
  email: z.string().email('Valid email is required'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  disciplineIds: z.array(z.string()).optional(),
  serviceIds: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'FRONT_DESK' && (!data.name || data.name.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Name is required for Front Desk',
      path: ['name'],
    });
  }
  if (data.role === 'PROVIDER') {
    if (!data.firstName || data.firstName.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'First name is required for Provider',
        path: ['firstName'],
      });
    }
    if (!data.lastName || data.lastName.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Last name is required for Provider',
        path: ['lastName'],
      });
    }
    if (!data.disciplineIds || data.disciplineIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select at least one discipline',
        path: ['disciplineIds'],
      });
    }
    if (!data.serviceIds || data.serviceIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select at least one service',
        path: ['serviceIds'],
      });
    }
  }
});

type StaffFormData = z.infer<typeof staffSchema>;

export function AddStaffModal({ open, onOpenChange }: any) {
  const toast = useAppToast();
  const queryClient = useQueryClient();
  const [role, setRole] = useState<'FRONT_DESK' | 'PROVIDER'>('FRONT_DESK');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: { 
      role: 'FRONT_DESK', 
      name: '', 
      email: '', 
      firstName: '', 
      lastName: '',
      disciplineIds: [],
      serviceIds: [],
    },
  });

  const selectedDisciplineIds = watch('disciplineIds') || [];
  const selectedServiceIds = watch('serviceIds') || [];

  const { data: disciplines = [] } = useQuery({
    queryKey: ['disciplines'],
    queryFn: getDisciplines,
    enabled: open && role === 'PROVIDER',
  });

  const { data: allServices = [] } = useQuery({
    queryKey: ['dashboard-services'],
    queryFn: getDashboardServices,
    enabled: open && role === 'PROVIDER',
  });

  // Filter services by selected disciplines
  const filteredServices = allServices.filter(s => 
    selectedDisciplineIds.includes(s.discipline.id)
  );

  const inviteMutation = useMutation({
    mutationFn: (data: any) => inviteStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      reset();
      toast.success('Staff invitation sent');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Unable to invite staff');
    },
  });

  const onSubmit = (data: StaffFormData) => {
    const payload = {
      ...data,
      // The backend createProvider expects 'services' as an array of objects
      services: data.role === 'PROVIDER' 
        ? data.serviceIds?.map(id => ({ serviceId: id })) 
        : undefined
    };
    inviteMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite New Staff</DialogTitle>
          <DialogDescription>Add a new provider or front desk member.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">Role</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="roleGroup"
                  value="FRONT_DESK"
                  checked={role === 'FRONT_DESK'}
                  onChange={() => { setRole('FRONT_DESK'); setValue('role', 'FRONT_DESK'); }}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-sm">Front Desk</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="roleGroup"
                  value="PROVIDER"
                  checked={role === 'PROVIDER'}
                  onChange={() => { setRole('PROVIDER'); setValue('role', 'PROVIDER'); }}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-sm">Provider</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input {...register('email')} placeholder="email@clinic.com" />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          {role === 'FRONT_DESK' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input {...register('name')} placeholder="Jamie Rivera" />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <Input {...register('firstName')} placeholder="Jamie" />
                  {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input {...register('lastName')} placeholder="Rivera" />
                  {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Disciplines</label>
                <div className="grid grid-cols-1 gap-2 border rounded-md p-3 max-h-40 overflow-y-auto">
                  {disciplines.length === 0 ? (
                    <p className="text-xs text-muted-foreground Italics">No disciplines found. Please create one first.</p>
                  ) : (
                    disciplines.map(d => (
                      <label key={d.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input 
                          type="checkbox" 
                          value={d.id}
                          checked={selectedDisciplineIds.includes(d.id)}
                          onChange={(e) => {
                            const current = selectedDisciplineIds;
                            const newVal = e.target.checked 
                              ? [...current, d.id]
                              : current.filter(id => id !== d.id);
                            setValue('disciplineIds', newVal);
                          }}
                        />
                        {d.name}
                      </label>
                    ))
                  )}
                </div>
                {errors.disciplineIds && <p className="text-sm text-red-500">{errors.disciplineIds.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Services</label>
                <div className="grid grid-cols-1 gap-2 border rounded-md p-3 max-h-40 overflow-y-auto">
                  {selectedDisciplineIds.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Select disciplines first to see services.</p>
                  ) : filteredServices.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No services found for selected disciplines.</p>
                  ) : (
                    filteredServices.map(s => (
                      <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input 
                          type="checkbox" 
                          value={s.id}
                          checked={selectedServiceIds.includes(s.id)}
                          onChange={(e) => {
                            const current = selectedServiceIds;
                            const newVal = e.target.checked 
                              ? [...current, s.id]
                              : current.filter(id => id !== s.id);
                            setValue('serviceIds', newVal);
                          }}
                        />
                        {s.name} ({s.discipline.name})
                      </label>
                    ))
                  )}
                </div>
                {errors.serviceIds && <p className="text-sm text-red-500">{errors.serviceIds.message}</p>}
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={inviteMutation.isPending || (role === 'PROVIDER' && disciplines.length === 0)}>
              {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
