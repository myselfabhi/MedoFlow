'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import type { User } from '@/lib/types';

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
      return data.data.user;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-red-600">Failed to load user data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Welcome to Medoflow</p>
      </div>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Your Profile</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="text-sm font-medium text-gray-500">Name</span>
            <p className="text-gray-900">{data.name}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Email</span>
            <p className="text-gray-900">{data.email}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Role</span>
            <p className="text-gray-900">{data.role.replace('_', ' ')}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Clinic ID</span>
            <p className="text-gray-900">{data.clinicId || '—'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
