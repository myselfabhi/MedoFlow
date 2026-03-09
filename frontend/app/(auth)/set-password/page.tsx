'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

const setPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SetPasswordFormData = z.infer<typeof setPasswordSchema>;

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
  });

  const onSubmit = async (data: SetPasswordFormData) => {
    if (!token) {
      setError('Invalid or missing invite link. Please request a new one.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post('/auth/set-password', {
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response
        : null;
      const message = res?.data?.message || 'Failed to set password. The link may have expired.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold text-gray-900">Set Password</h1>
          <p className="mt-1 text-sm text-gray-500">
            Invalid or missing invite link. Please contact your administrator to request a new invite.
          </p>
        </CardHeader>
        <CardContent>
          <Link
            href="/login"
            className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to login
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <p className="text-center text-gray-900">Password set successfully.</p>
          <p className="text-center text-sm text-gray-500">
            Redirecting to login...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h1 className="text-2xl font-semibold text-gray-900">Set your password</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a password to access your Medoflow account.
        </p>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(onSubmit)(e);
          }}
          className="space-y-4"
        >
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
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
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Setting password...' : 'Set password'}
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

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="py-12 text-center text-gray-500">Loading...</CardContent>
        </Card>
      }
    >
      <SetPasswordForm />
    </Suspense>
  );
}
