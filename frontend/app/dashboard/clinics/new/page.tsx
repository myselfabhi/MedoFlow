'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';

export default function CreateClinicPage() {
  const { user } = useAuth();

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Create Clinic</h1>
        <p className="text-gray-500">Only Super Admins can create clinics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Create Clinic</h1>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Register a Clinic Admin</h2>
          <p className="mt-1 text-sm text-gray-500">
            Clinics are created when you register a new Clinic Admin account. The clinic will be
            created automatically with the name and email you provide.
          </p>
        </CardHeader>
        <CardContent>
          <Link href="/register">
            <Button>Go to Registration</Button>
          </Link>
          <p className="mt-3 text-sm text-gray-500">
            Select &quot;Clinic Admin&quot; as the role and enter the clinic name and email.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
