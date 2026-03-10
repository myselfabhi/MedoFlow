'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import {
  AppCard,
  AppCardHeader,
  AppCardContent,
  AppButton,
  AppPageHeader,
} from '@/components/ui-system';
import type { User } from '@/lib/types';
import { CalendarPlus } from 'lucide-react';

export function PatientDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
      return data.data.user;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <AppCard>
        <AppCardContent>
          <p className="text-destructive">Failed to load user data</p>
        </AppCardContent>
      </AppCard>
    );
  }

  const bookHref = data.clinicId ? `/clinic/${data.clinicId}` : '/';

  return (
    <div className="space-y-6">
      <AppPageHeader
        title="Dashboard"
        description="Welcome to Medoflow"
        actions={
          <AppButton asChild>
            <Link href={bookHref}>
              <CalendarPlus className="h-4 w-4" />
              Book Now
            </Link>
          </AppButton>
        }
      />

      <AppCard>
        <AppCardHeader>
          <h2 className="text-lg font-medium text-foreground">Your Profile</h2>
        </AppCardHeader>
        <AppCardContent className="space-y-4">
          <div>
            <span className="text-sm font-medium text-muted-foreground">Name</span>
            <p className="text-foreground">{data.name}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Email</span>
            <p className="text-foreground">{data.email}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Role</span>
            <p className="text-foreground">{data.role.replace('_', ' ')}</p>
          </div>
        </AppCardContent>
      </AppCard>
    </div>
  );
}
