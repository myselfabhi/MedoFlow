'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { AppButton } from '@/components/ui-system/AppButton';

export function AppNavbar() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div>
        <span className="text-sm text-muted-foreground">Dashboard</span>
      </div>
      <nav className="hidden items-center gap-6 md:flex">
        <Link href="/store" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Store
        </Link>
        <Link href="/store?tab=products" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Products
        </Link>
        <Link href="/store?tab=packages" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          Packages
        </Link>
      </nav>
      <div className="flex items-center gap-3">
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
