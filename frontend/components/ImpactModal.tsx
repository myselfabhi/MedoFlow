'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

interface ImpactModalProps {
  isOpen: boolean;
  onClose: () => void;
  affectedCount: number;
  onForceUpdate: () => void;
  onCancel: () => void;
  isForceLoading?: boolean;
}

export function ImpactModal({
  isOpen,
  onClose,
  affectedCount,
  onForceUpdate,
  onCancel,
  isForceLoading = false,
}: ImpactModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Availability Change Will Affect {affectedCount} Appointment{affectedCount !== 1 ? 's' : ''}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-gray-600 mb-6">
            This update will affect{' '}
            <span className="font-semibold text-gray-900">{affectedCount}</span> future
            appointment{affectedCount !== 1 ? 's' : ''}. Do you want to continue?
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isForceLoading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onForceUpdate}
              disabled={isForceLoading}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 w-full sm:w-auto"
            >
              {isForceLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Updating...
                </>
              ) : (
                'Force Update'
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
