'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import api from '@/lib/api';
import {
  AppCard,
  AppCardHeader,
  AppCardContent,
  AppButton,
  AppInput,
  AppFormField,
} from '@/components/ui-system';

const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['SUPER_ADMIN', 'PROVIDER', 'FRONT_DESK']).optional(),
    clinicId: z.string().optional(),
    clinicName: z.string().optional(),
    clinicEmail: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === 'FRONT_DESK') {
        return !!data.clinicId;
      }
      return true;
    },
    { message: 'Clinic ID is required for FRONT_DESK', path: ['clinicId'] }
  )
  .refine(
    (data) => {
      if (data.role === 'PROVIDER') {
        return !!data.clinicId;
      }
      if (data.role === 'SUPER_ADMIN') {
        return !!data.clinicName && !!data.clinicEmail;
      }
      return true;
    },
    {
      message: 'Clinic ID is required for PROVIDER and clinic details are required for SUPER_ADMIN',
      path: ['clinicId'],
    }
  );

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'SUPER_ADMIN' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const payload: Record<string, string> = {
        name: data.name,
        email: data.email,
        password: data.password,
      };
      if (data.role) payload.role = data.role;
      if (data.role === 'SUPER_ADMIN' && data.clinicName && data.clinicEmail) {
        payload.clinicName = data.clinicName;
        payload.clinicEmail = data.clinicEmail;
      }
      if (
        (data.role === 'PROVIDER' || data.role === 'FRONT_DESK') &&
        data.clinicId
      ) {
        payload.clinicId = data.clinicId;
      }
      await api.post('/auth/register', payload);
      router.push('/login');
      router.refresh();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Registration failed';
      setError(message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppCard>
      <AppCardHeader>
        <h1 className="text-2xl font-semibold text-slate-900">Create account</h1>
        <p className="mt-1 text-sm text-slate-600">Register for Medoflow</p>
      </AppCardHeader>
      <AppCardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
              {error}
            </div>
          )}
          <AppFormField label="Name" htmlFor="name" error={errors.name?.message}>
            <AppInput
              id="name"
              type="text"
              className={errors.name ? 'border-danger' : ''}
              {...register('name')}
            />
          </AppFormField>
          <AppFormField label="Email" htmlFor="email" error={errors.email?.message}>
            <AppInput
              id="email"
              type="email"
              autoComplete="email"
              className={errors.email ? 'border-danger' : ''}
              {...register('email')}
            />
          </AppFormField>
          <AppFormField label="Password" htmlFor="password" error={errors.password?.message}>
            <AppInput
              id="password"
              type="password"
              autoComplete="new-password"
              className={errors.password ? 'border-danger' : ''}
              {...register('password')}
            />
          </AppFormField>
          <AppFormField label="Role" htmlFor="role">
            <select
              id="role"
              className="flex h-9 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              {...register('role')}
            >
              <option value="FRONT_DESK">Front Desk</option>
              <option value="PROVIDER">Provider</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </AppFormField>
          {selectedRole === 'SUPER_ADMIN' && (
            <>
              <AppFormField
                label="Clinic Name"
                htmlFor="clinicName"
                error={errors.clinicName?.message}
              >
                <AppInput
                  id="clinicName"
                  type="text"
                  className={errors.clinicName ? 'border-danger' : ''}
                  {...register('clinicName')}
                />
              </AppFormField>
              <AppFormField
                label="Clinic Email"
                htmlFor="clinicEmail"
                error={errors.clinicEmail?.message}
              >
                <AppInput
                  id="clinicEmail"
                  type="email"
                  className={errors.clinicEmail ? 'border-danger' : ''}
                  {...register('clinicEmail')}
                />
              </AppFormField>
            </>
          )}
          {(selectedRole === 'PROVIDER' || selectedRole === 'FRONT_DESK') && (
            <AppFormField
              label="Clinic ID"
              htmlFor="clinicId"
              description="Enter existing clinic ID"
              error={errors.clinicId?.message}
            >
              <AppInput
                id="clinicId"
                type="text"
                placeholder="Enter existing clinic ID"
                className={errors.clinicId ? 'border-danger' : ''}
                {...register('clinicId')}
              />
            </AppFormField>
          )}
          <AppButton type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </AppButton>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </p>
      </AppCardContent>
    </AppCard>
  );
}
