'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import api from '@/lib/api';
import { AppCard, AppCardContent, AppCardHeader } from '@/components/ui-system/AppCard';
import { AppInput } from '@/components/ui-system/AppInput';
import { AppButton } from '@/components/ui-system/AppButton';
import { AppFormField } from '@/components/ui-system/AppFormField';

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
      <AppCard>
        <AppCardHeader>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Set Password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Invalid or missing invite link. Please contact your administrator to request a new invite.
          </p>
        </AppCardHeader>
        <AppCardContent>
          <AppButton asChild variant="outline" className="w-full">
            <Link href="/login">Back to login</Link>
          </AppButton>
        </AppCardContent>
      </AppCard>
    );
  }

  if (success) {
    return (
      <AppCard>
        <AppCardContent className="flex flex-col items-center gap-4 py-8">
          <p className="text-center text-slate-900 font-medium">Password set successfully.</p>
          <p className="text-center text-sm text-slate-500">
            Redirecting to login...
          </p>
        </AppCardContent>
      </AppCard>
    );
  }

  return (
    <AppCard>
      <AppCardHeader>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Set your password</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create a password to access your Medoflow account.
        </p>
      </AppCardHeader>
      <AppCardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(onSubmit)(e);
          }}
          className="space-y-4"
        >
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          <AppFormField label="Password" htmlFor="password" error={errors.password?.message}>
            <AppInput
              id="password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
            />
          </AppFormField>
          <AppFormField label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
            <AppInput
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
          </AppFormField>
          <AppButton
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Setting password...' : 'Set password'}
          </AppButton>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </p>
      </AppCardContent>
    </AppCard>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AppCard>
          <AppCardContent className="py-12 text-center text-slate-500">Loading...</AppCardContent>
        </AppCard>
      }
    >
      <SetPasswordForm />
    </Suspense>
  );
}
