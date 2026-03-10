'use client';

import { AppEmptyState } from '@/components/ui-system';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState(props: EmptyStateProps) {
  return <AppEmptyState {...props} />;
}
