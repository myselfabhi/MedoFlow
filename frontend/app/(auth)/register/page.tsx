'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['SUPER_ADMIN', 'CLINIC_ADMIN', 'PROVIDER', 'STAFF']).optional(),
    clinicId: z.string().optional(),
    clinicName: z.string().optional(),
    clinicEmail: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === 'CLINIC_ADMIN') {
        return !!data.clinicName && !!data.clinicEmail;
      }
      return true;
    },
    { message: 'Clinic name and email are required for CLINIC_ADMIN', path: ['clinicName'] }
  )
  .refine(
    (data) => {
      if (data.role === 'PROVIDER' || data.role === 'STAFF') {
        return !!data.clinicId;
      }
      return true;
    },
    { message: 'Clinic ID is required for PROVIDER and STAFF', path: ['clinicId'] }
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
    defaultValues: { role: 'STAFF' },
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
      if (data.role === 'CLINIC_ADMIN' && data.clinicName && data.clinicEmail) {
        payload.clinicName = data.clinicName;
        payload.clinicEmail = data.clinicEmail;
      }
      if ((data.role === 'PROVIDER' || data.role === 'STAFF') && data.clinicId) {
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
    <Card>
      <CardHeader>
        <h1 className="text-2xl font-semibold text-gray-900">Create account</h1>
        <p className="mt-1 text-sm text-gray-500">Register for Medoflow</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
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
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              {...register('role')}
            >
              <option value="STAFF">Staff</option>
              <option value="PROVIDER">Provider</option>
              <option value="CLINIC_ADMIN">Clinic Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
          {selectedRole === 'CLINIC_ADMIN' && (
            <>
              <div>
                <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700">
                  Clinic Name
                </label>
                <input
                  id="clinicName"
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  {...register('clinicName')}
                />
                {errors.clinicName && (
                  <p className="mt-1 text-sm text-red-600">{errors.clinicName.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="clinicEmail" className="block text-sm font-medium text-gray-700">
                  Clinic Email
                </label>
                <input
                  id="clinicEmail"
                  type="email"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  {...register('clinicEmail')}
                />
                {errors.clinicEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.clinicEmail.message}</p>
                )}
              </div>
            </>
          )}
          {(selectedRole === 'PROVIDER' || selectedRole === 'STAFF') && (
            <div>
              <label htmlFor="clinicId" className="block text-sm font-medium text-gray-700">
                Clinic ID
              </label>
              <input
                id="clinicId"
                type="text"
                placeholder="Enter existing clinic ID"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                {...register('clinicId')}
              />
              {errors.clinicId && (
                <p className="mt-1 text-sm text-red-600">{errors.clinicId.message}</p>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
