'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">Dashboard</span>
      </div>
      <nav className="hidden items-center gap-6 md:flex">
        <Link href="/store" className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
          Store
        </Link>
        <Link href="/store?tab=products" className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
          Products
        </Link>
        <Link href="/store?tab=packages" className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
          Packages
        </Link>
      </nav>
      <div className="flex items-center gap-4">
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
