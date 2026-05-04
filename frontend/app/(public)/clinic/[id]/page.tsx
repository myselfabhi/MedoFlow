'use client'

/**
 * Patient-facing clinic site at /clinic/[idOrSlug].
 *
 * Mirrors the Medoflow landing structure (hero / trust / value props /
 * testimonial / final CTA) but rebranded by the clinic's themeColor +
 * logoUrl. Services and providers are private and only render once a
 * patient has signed in. The avatar dropdown opens a single PatientHub
 * modal — no navigation off this domain.
 */

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getClinic } from '@/lib/clinicApi'
import { getClinicServices } from '@/lib/serviceApi'
import { getClinicProviders } from '@/lib/providerApi'
import { getClinicLocations } from '@/lib/appointmentApi'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/components/auth/AuthModal'
import { ClinicLanding } from '@/components/clinic/ClinicLanding'
import { ClinicHeader } from '@/components/clinic/ClinicHeader'
import { PatientHubModal, type PatientHubTab } from '@/components/clinic/PatientHubModal'
import { PatientWelcomeCard } from '@/components/clinic/PatientWelcomeCard'
import { WrongClinicBlock } from '@/components/clinic/WrongClinicBlock'
import { Building2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

const DEFAULT_THEME = '#0D9488'

export default function ClinicDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { user, isAuthenticated } = useAuth()
  const { openLogin } = useAuthModal()

  const [hubOpen, setHubOpen] = React.useState(false)
  const [hubTab, setHubTab] = React.useState<PatientHubTab>('overview')

  const {
    data: clinic,
    isLoading: clinicLoading,
    error: clinicError,
  } = useQuery({
    queryKey: ['clinic', id],
    queryFn: () => getClinic(id),
    enabled: !!id,
  })

  // Services + providers + locations are only fetched once the patient is
  // authenticated. Public site never makes those network calls.
  const enablePrivate = !!id && isAuthenticated && user?.role === 'PATIENT'

  const { data: services } = useQuery({
    queryKey: ['clinic-services', id],
    queryFn: () => getClinicServices(id),
    enabled: enablePrivate,
  })

  const { data: providers } = useQuery({
    queryKey: ['clinic-providers', id],
    queryFn: () => getClinicProviders(id),
    enabled: enablePrivate,
  })

  const { data: locations } = useQuery({
    queryKey: ['clinic-locations', id],
    queryFn: () => getClinicLocations(id),
    enabled: enablePrivate,
  })

  const themeColor = clinic?.themeColor?.trim() || DEFAULT_THEME
  const routeId = clinic?.slug ?? id

  const primaryLocation = locations?.[0] ?? null

  const isPatient = user?.role === 'PATIENT'

  const openHub = (initial: PatientHubTab) => {
    setHubTab(initial)
    setHubOpen(true)
  }

  const handleBook = (serviceId: string) => {
    if (!isAuthenticated || !isPatient) {
      openLogin()
      return
    }
    router.push(`/book/${serviceId}?clinicId=${clinic?.id ?? id}`)
  }

  if (clinicError) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="inline-flex p-4 bg-rose-50 rounded-full text-rose-600 mb-6">
          <Building2 className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Clinic Not Found</h1>
        <p className="text-slate-500 mt-2">
          The clinic you are looking for does not exist or has been removed.
        </p>
      </div>
    )
  }

  if (clinicLoading || !clinic) {
    return (
      <div className="p-8 space-y-8 container mx-auto">
        <Skeleton className="h-[300px] w-full rounded-3xl" />
        <Skeleton className="h-[200px] w-full rounded-3xl" />
      </div>
    )
  }

  // Patient signed in AND is a member of this clinic — replace the marketing
  // hero with a "welcome back" card. Marketing sections still render below
  // so they can keep browsing the rest of the site (Shopify model).
  const isClinicPatient = isAuthenticated && isPatient && user?.clinicId === clinic.id
  const firstName = (user?.name ?? '').split(/\s+/).filter(Boolean)[0] ?? 'there'

  return (
    <div className="bg-white">
      <ClinicHeader clinic={clinic} themeColor={themeColor} routeId={routeId} onOpenHub={openHub} />

      {isClinicPatient && (
        <PatientWelcomeCard
          firstName={firstName}
          themeColor={themeColor}
          routeId={routeId}
          onOpenHub={openHub}
        />
      )}

      <ClinicLanding
        clinic={clinic}
        services={services}
        providers={providers}
        primaryLocation={primaryLocation}
        themeColor={themeColor}
        onBook={handleBook}
      />

      {/* Slim attribution footer (no Medoflow chrome). */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-slate-400 sm:flex-row lg:px-8">
          <p>
            © {new Date().getFullYear()} {clinic.name}. All rights reserved.
          </p>
          <p className="font-medium">Powered by Medoflow</p>
        </div>
      </footer>

      <PatientHubModal
        open={hubOpen}
        onOpenChange={setHubOpen}
        initialTab={hubTab}
        themeColor={themeColor}
      />
    </div>
  )
}
