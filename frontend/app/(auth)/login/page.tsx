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
  AppCardContent,
  AppButton,
  AppInput,
  AppFormField,
} from '@/components/ui-system';
import { ShieldCheck, ArrowRight, Lock, Mail } from 'lucide-react';
import { AppLogo } from '@/components/common/AppLogo';

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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-6">
        <AppLogo size="lg" className="justify-start" />
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-slate-500 font-medium">Access your clinic portal and records.</p>
        </div>
      </div>

      <AppCard className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
        <AppCardContent className="p-8 sm:p-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(onSubmit)(e);
            }}
            className="space-y-6"
          >
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 font-medium flex gap-3 items-start">
                <div className="p-1 bg-rose-100 rounded-full shrink-0 mt-0.5">
                  <ShieldCheck className="h-3 w-3" />
                </div>
                {error}
              </div>
            )}
            
            <AppFormField label="Work Email" htmlFor="email" error={errors.email?.message}>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <AppInput
                  id="email"
                  type="email"
                  placeholder="name@clinic.com"
                  autoComplete="email"
                  className={cn("pl-11 rounded-2xl h-12", errors.email ? 'border-danger' : 'border-slate-100')}
                  {...register('email')}
                />
              </div>
            </AppFormField>

            <AppFormField label="Password" htmlFor="password" error={errors.password?.message}>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <AppInput
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={cn("pl-11 rounded-2xl h-12", errors.password ? 'border-danger' : 'border-slate-100')}
                  {...register('password')}
                />
              </div>
            </AppFormField>

            <div className="flex justify-end">
              <Link href="#" className="text-xs font-bold text-primary-600 hover:text-primary-700 uppercase tracking-wider">
                Forgot Password?
              </Link>
            </div>

            <AppButton
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary-100 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Sign In <ArrowRight className="h-5 w-5" />
                </>
              )}
            </AppButton>
          </form>
        </AppCardContent>
      </AppCard>

      <p className="text-center text-sm font-medium text-slate-500">
        New to Medoflow?{' '}
        <Link href="/register" className="font-bold text-primary-600 hover:text-primary-700 underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

