'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { getAppointmentById } from '@/lib/patientApi';
import { getTemplatesForAppointment } from '@/lib/formsApi';
import { DynamicFormRenderer } from '@/components/forms/DynamicFormRenderer';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/Card';

export default function IntakePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const appointmentId = params.appointmentId as string;

  const [currentFormIndex, setCurrentFormIndex] = useState(0);

  const { data: appointment, isLoading: appointmentLoading, error: appointmentError } =
    useQuery({
      queryKey: ['intake', 'appointment', appointmentId],
      queryFn: () => getAppointmentById(appointmentId),
      enabled: !!appointmentId && !!user,
    });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['intake', 'templates', appointmentId],
    queryFn: () => getTemplatesForAppointment(appointmentId),
    enabled: !!appointmentId && !!appointment && !!user,
  });

  const isLoading = appointmentLoading || templatesLoading;
  const hasForms = templates.length > 0;
  const currentTemplate = templates[currentFormIndex];
  const totalForms = templates.length;
  const isLastForm = currentFormIndex >= totalForms - 1;

  const handleFormComplete = () => {
    if (isLastForm) {
      router.push('/dashboard/appointments');
    } else {
      setCurrentFormIndex((i) => i + 1);
    }
  };

  useEffect(() => {
    if (!isLoading && appointment && !hasForms) {
      router.replace('/dashboard/appointments');
    }
  }, [isLoading, appointment, hasForms, router]);

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-xl flex-col items-center justify-center px-4">
        <p className="text-sm text-gray-600">Please log in to complete your intake forms.</p>
        <Link
          href="/login"
          className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Go to login
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (appointmentError || !appointment) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load appointment. It may be unavailable.
        </div>
        <Link
          href="/dashboard/appointments"
          className="mt-4 inline-block text-sm text-primary-600 hover:text-primary-700"
        >
          ← Back to appointments
        </Link>
      </div>
    );
  }

  if (!hasForms) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl flex-col px-4 py-10 sm:px-6">
      {totalForms > 1 && (
        <p className="mb-6 text-center text-sm font-medium text-gray-500">
          Form {currentFormIndex + 1} of {totalForms}
        </p>
      )}
      <div className="flex justify-center">
        <DynamicFormRenderer
          template={currentTemplate}
          patientId={user.id}
          appointmentId={appointmentId}
          onComplete={handleFormComplete}
        />
      </div>
      <div className="mt-6 text-center">
        <Link
          href="/dashboard/appointments"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Skip and go to appointments
        </Link>
      </div>
    </div>
  );
}
