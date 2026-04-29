'use client'

/**
 * /clinic/[idOrSlug]/store — dedicated full storefront for the clinic's
 * patients. Same gating as the rest of the clinic site:
 *
 *   • Logged-out → routed to the clinic landing with the auth modal opened
 *   • Logged-in patient of THIS clinic → full grid renders
 *   • Logged-in patient of a DIFFERENT clinic → wrong-clinic notice
 *     (rendered inside <ClinicStorefront>)
 *
 * Header and footer match the clinic landing — Medoflow chrome is already
 * stripped at the layout level (`/clinic/*` routes).
 */

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/components/auth/AuthModal'
import { getClinic } from '@/lib/clinicApi'
import { ClinicHeader } from '@/components/clinic/ClinicHeader'
import { ClinicStorefront } from '@/components/clinic/ClinicStorefront'
import { PatientHubModal, type PatientHubTab } from '@/components/clinic/PatientHubModal'
import { Building2, ChevronLeft } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

const DEFAULT_THEME = '#0D9488'

export default function ClinicStorePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { openLogin } = useAuthModal()

  const [hubOpen, setHubOpen] = React.useState(false)
  const [hubTab, setHubTab] = React.useState<PatientHubTab>('overview')

  const { data: clinic, isLoading: clinicLoading, error: clinicError } = useQuery({
    queryKey: ['clinic', id],
    queryFn: () => getClinic(id),
    enabled: !!id,
  })

  // Logged-out → bounce to landing and open the auth modal. We can't
  // render the storefront because we don't know which clinic to scope
  // the cart to without a logged-in user.
  React.useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.replace(`/clinic/${id}`)
      // The clinic landing's existing flow will surface the sign-in CTA;
      // we also nudge the modal open in case the visitor came in cold.
      setTimeout(() => openLogin(), 50)
    }
  }, [authLoading, isAuthenticated, id, router, openLogin])

  if (clinicError) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="inline-flex p-4 bg-rose-50 rounded-full text-rose-600 mb-6">
          <Building2 className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Clinic Not Found</h1>
        <p className="text-slate-500 mt-2">The clinic you are looking for does not exist or has been removed.</p>
      </div>
    )
  }

  if (clinicLoading || !clinic || authLoading || !isAuthenticated) {
    return (
      <div className="p-8 space-y-8 container mx-auto">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-[400px] w-full rounded-3xl" />
      </div>
    )
  }

  const themeColor = clinic.themeColor?.trim() || DEFAULT_THEME
  const routeId = clinic.slug ?? id
  const isPatient = user?.role === 'PATIENT'

  const openHub = (tab: PatientHubTab) => {
    setHubTab(tab)
    setHubOpen(true)
  }

  return (
    <div className="bg-white">
      <ClinicHeader
        clinic={clinic}
        themeColor={themeColor}
        routeId={routeId}
        onOpenHub={openHub}
      />

      {/* Crumb back to landing */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 lg:px-8">
        <Link
          href={`/clinic/${routeId}`}
          className="inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-600"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to {clinic.name}
        </Link>
      </div>

      {isPatient ? (
        <ClinicStorefront
          clinicId={clinic.id}
          routeId={routeId}
          clinicName={clinic.name}
          themeColor={themeColor}
          variant="full"
        />
      ) : (
        // Non-patient role (admin / front-desk / provider) accidentally on a
        // patient-store route — friendly no-op.
        <section className="mx-auto max-w-3xl px-4 py-16 text-center lg:px-8">
          <h2 className="text-xl font-black text-slate-900">Patients only</h2>
          <p className="mt-2 text-sm text-slate-500">
            The {clinic.name} storefront is available to patients of this clinic.
          </p>
        </section>
      )}

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
