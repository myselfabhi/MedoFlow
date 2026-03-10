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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Welcome back</span>
        {user && (
          <span className="font-medium text-foreground">{user.name}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-subtle text-muted-foreground">
            <User className="h-4 w-4" />
          </div>
        )}
        <AppButton
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-2 text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </AppButton>
      </div>
    </header>
  );
}
