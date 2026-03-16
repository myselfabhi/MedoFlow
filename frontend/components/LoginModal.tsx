'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppButton, AppInput, AppFormField } from '@/components/ui-system';
import { X } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onSubmit: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function LoginModal({
  isOpen,
  onClose,
  email,
  onSubmit,
  isLoading = false,
  error = null,
}: LoginModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  React.useEffect(() => {
    if (email) setValue('email', email);
  }, [email, setValue]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data: LoginFormData) => {
    await onSubmit(data.email, data.password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-card overflow-hidden"
        role="dialog"
        aria-labelledby="login-modal-title"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id="login-modal-title" className="text-lg font-semibold text-foreground">
            Sign in to continue
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-subtle hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="mb-5 text-sm text-muted-foreground">
            You already have an account. Please sign in to complete your booking.
          </p>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive font-medium">
                {error}
              </div>
            )}
            <AppFormField label="Email" htmlFor="login-email" error={errors.email?.message}>
              <AppInput
                id="login-email"
                type="email"
                placeholder="name@example.com"
                className="rounded-xl h-11 border-input"
                {...register('email')}
              />
            </AppFormField>
            <AppFormField label="Password" htmlFor="login-password" error={errors.password?.message}>
              <AppInput
                id="login-password"
                type="password"
                placeholder="••••••••"
                className="rounded-xl h-11 border-input"
                {...register('password')}
              />
            </AppFormField>
            <div className="flex gap-3 pt-2">
              <AppButton
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-xl"
              >
                Cancel
              </AppButton>
              <AppButton
                type="submit"
                disabled={isLoading}
                className="flex-1 rounded-xl"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </AppButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
