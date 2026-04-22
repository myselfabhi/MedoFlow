'use client';

import React from 'react';
import { usePatientPortal } from './PatientPortalContext';
import { AppointmentsModal } from './modals/AppointmentsModal';
import { RecordsModal } from './modals/RecordsModal';
import { BillingModal } from './modals/BillingModal';
import { ProfileModal } from './modals/ProfileModal';
import { SettingsModal } from './modals/SettingsModal';
import { HelpModal } from './modals/HelpModal';
import { BookingModal } from './modals/BookingModal';

export function PatientPortalModals() {
  const { openView, close } = usePatientPortal();

  const makeHandler = (view: string) => (next: boolean) => {
    if (!next && openView === view) close();
  };

  return (
    <>
      <BookingModal open={openView === 'booking'} onOpenChange={makeHandler('booking')} />
      <AppointmentsModal open={openView === 'appointments'} onOpenChange={makeHandler('appointments')} />
      <RecordsModal open={openView === 'records'} onOpenChange={makeHandler('records')} />
      <BillingModal open={openView === 'billing'} onOpenChange={makeHandler('billing')} />
      <ProfileModal open={openView === 'profile'} onOpenChange={makeHandler('profile')} />
      <SettingsModal open={openView === 'settings'} onOpenChange={makeHandler('settings')} />
      <HelpModal open={openView === 'help'} onOpenChange={makeHandler('help')} />
    </>
  );
}
