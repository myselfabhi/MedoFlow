'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { AppButton } from '@/components/ui-system/AppButton';
import { cn } from '@/lib/utils';

export function AppNavbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-card px-6">
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600">Welcome back</span>
        {user && (
          <span className="font-medium text-slate-900">{user.name}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <User className="h-4 w-4" />
          </div>
        )}
        <AppButton
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-2 text-slate-600"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </AppButton>
      </div>
    </header>
  );
}
