'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  AppCard,
  AppCardHeader,
  AppCardContent,
  AppButton,
  AppInput,
  AppFormField,
} from '@/components/ui-system';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  const { login, isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace(returnUrl);
    }
  }, [isAuthenticated, returnUrl, router]);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Login failed';
      setError(message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppCard>
      <AppCardHeader>
        <h1 className="text-2xl font-semibold text-slate-900">Sign in to Medoflow</h1>
        <p className="mt-1 text-sm text-slate-600">Enter your credentials</p>
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
            <div className="rounded-xl border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
              {error}
            </div>
          )}
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
              autoComplete="current-password"
              className={errors.password ? 'border-danger' : ''}
              {...register('password')}
            />
          </AppFormField>
          <AppButton
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </AppButton>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
            Register
          </Link>
        </p>
      </AppCardContent>
    </AppCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AppCard>
          <AppCardContent className="py-12 text-center text-slate-600">
            Loading...
          </AppCardContent>
        </AppCard>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
