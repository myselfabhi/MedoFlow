'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">Welcome back</span>
        {user && (
          <span className="font-medium text-gray-900">{user.name}</span>
        )}
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-800">
            {user.role.replace('_', ' ')}
          </span>
        )}
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
