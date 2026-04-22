'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuth, landingForRole } from '@/contexts/AuthContext';
import {
  AppCard,
  AppCardContent,
  AppButton,
  AppInput,
  AppFormField,
} from '@/components/ui-system';
import { ShieldCheck, ArrowRight, Lock, Mail } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrlParam = searchParams.get('returnUrl');
  const { login, isAuthenticated, user } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(returnUrlParam || landingForRole(user));
    }
  }, [isAuthenticated, user, returnUrlParam, router]);
  
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
      const signedInUser = await login(data.email, data.password);
      router.replace(returnUrlParam || landingForRole(signedInUser));
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
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-foreground tracking-tight">Welcome Back</h1>
          <p className="text-muted-foreground font-medium">Access your clinic portal and records.</p>
        </div>
      </div>

      <AppCard className="border border-border shadow-card rounded-2xl overflow-hidden bg-card">
        <AppCardContent className="p-8 sm:p-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(onSubmit)(e);
            }}
            className="space-y-6"
          >
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive font-medium flex gap-3 items-start">
                <div className="p-1 bg-destructive/20 rounded-full shrink-0 mt-0.5">
                  <ShieldCheck className="h-3 w-3 text-destructive" />
                </div>
                {error}
              </div>
            )}
            
            <AppFormField label="Work Email" htmlFor="email" error={errors.email?.message}>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <AppInput
                  id="email"
                  type="email"
                  placeholder="name@clinic.com"
                  autoComplete="email"
                  className={cn("pl-11 rounded-xl h-12 border-input", errors.email && "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive")}
                  {...register('email')}
                />
              </div>
            </AppFormField>

            <AppFormField label="Password" htmlFor="password" error={errors.password?.message}>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <AppInput
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={cn("pl-11 rounded-xl h-12 border-input", errors.password && "border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive")}
                  {...register('password')}
                />
              </div>
            </AppFormField>

            <div className="flex justify-end">
              <Link href="#" className="text-xs font-semibold text-primary hover:text-primary-700 uppercase tracking-wider transition-colors">
                Forgot Password?
              </Link>
            </div>

            <AppButton
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/10 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              ) : (
                <>
                  Sign In <ArrowRight className="h-5 w-5" />
                </>
              )}
            </AppButton>
          </form>
        </AppCardContent>
      </AppCard>

      <p className="text-center text-sm font-medium text-muted-foreground">
        New to Medoflow?{' '}
        <Link href="/register" className="font-semibold text-primary hover:text-primary-700 underline underline-offset-4 transition-colors">
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
