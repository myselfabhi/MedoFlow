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
  AppCardContent, 
  AppButton, 
  AppInput, 
  AppFormField 
} from '@/components/ui-system';
import { User, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
      };
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create Account</h1>
        <p className="text-slate-500 font-medium">Join our clinic as a patient today.</p>
      </div>

      <AppCard className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
        <AppCardContent className="p-8 sm:p-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 font-medium flex gap-3 items-start">
                <div className="p-1 bg-rose-100 rounded-full shrink-0 mt-0.5">
                  <ShieldCheck className="h-3 w-3" />
                </div>
                {error}
              </div>
            )}

            <AppFormField label="Full Name" htmlFor="name" error={errors.name?.message}>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <AppInput
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className={cn("pl-11 rounded-2xl h-12", errors.name ? 'border-danger' : 'border-slate-100')}
                  {...register('name')}
                />
              </div>
            </AppFormField>

            <AppFormField label="Email Address" htmlFor="email" error={errors.email?.message}>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <AppInput
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  autoComplete="email"
                  className={cn("pl-11 rounded-2xl h-12", errors.email ? 'border-danger' : 'border-slate-100')}
                  {...register('email')}
                />
              </div>
            </AppFormField>

            <AppFormField label="Set Password" htmlFor="password" error={errors.password?.message}>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <AppInput
                  id="password"
                  type="password"
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  className={cn("pl-11 rounded-2xl h-12", errors.password ? 'border-danger' : 'border-slate-100')}
                  {...register('password')}
                />
              </div>
            </AppFormField>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-500 leading-relaxed">
                By creating an account, you agree to our <Link href="#" className="font-bold underline">Terms of Service</Link> and <Link href="#" className="font-bold underline">Privacy Policy</Link>.
              </p>
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
                  Create Account <ArrowRight className="h-5 w-5" />
                </>
              )}
            </AppButton>
          </form>
        </AppCardContent>
      </AppCard>

      <p className="text-center text-sm font-medium text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-primary-600 hover:text-primary-700 underline underline-offset-4">
          Sign In
        </Link>
      </p>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

