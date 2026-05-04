'use client'

/**
 * Public renderer for clinic-built pages. Reads the published sections JSON
 * from the API and hands it to the same SiteSectionList used by the editor
 * preview, so the editor and the live page can never diverge.
 *
 * Wraps the rendered sections with the same ClinicHeader so the patient
 * sees branded chrome (logo, storefront nav, avatar dropdown). No marketing
 * footer — keep this surface theirs.
 */

import * as React from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'
import api from '@/lib/api'
import { getClinic } from '@/lib/clinicApi'
import { getClinicServices } from '@/lib/serviceApi'
import { getClinicProviders } from '@/lib/providerApi'
import { ClinicHeader } from '@/components/clinic/ClinicHeader'
import { PatientHubModal, type PatientHubTab } from '@/components/clinic/PatientHubModal'
import { SiteSectionList } from '@/components/clinic/SiteSectionRenderer'
import type { Section } from '@/lib/siteSections'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'

const DEFAULT_THEME = '#0D9488'

interface PublishedPage {
  id: string
  title: string
  slug: string
  sectionsJson: Section[]
  seoTitle: string | null
  seoDescription: string | null
  publishedAt: string | null
}

async function getPublishedPage(clinicId: string, slug: string): Promise<PublishedPage | null> {
  try {
    const { data } = await api.get<{ success: boolean; data: PublishedPage }>(
      `/public/clinics/${clinicId}/pages/${slug}`
    )
    return data.data
  } catch (e: unknown) {
    if ((e as { response?: { status?: number } })?.response?.status === 404) return null
    throw e
  }
}

export default function ClinicBuiltPage() {
  const params = useParams<{ id: string; slug: string }>()
  const id = params?.id ?? ''
  const slug = params?.slug ?? ''
  const { user, isAuthenticated } = useAuth()

  const [hubOpen, setHubOpen] = React.useState(false)
  const [hubTab, setHubTab] = React.useState<PatientHubTab>('overview')
  const openHub = (tab: PatientHubTab) => {
    setHubTab(tab)
    setHubOpen(true)
  }

  const { data: clinic } = useQuery({
    queryKey: ['clinic', id],
    queryFn: () => getClinic(id),
    enabled: !!id,
  })

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

  const {
    data: page,
    isLoading: pageLoading,
    error: pageError,
  } = useQuery({
    queryKey: ['published-page', id, slug],
    queryFn: () => getPublishedPage(id, slug),
    enabled: !!id && !!slug,
  })

  if (pageError) {
    return <NotFoundLayout reason="Could not load this page." />
  }
  if (pageLoading || !clinic) {
    return (
      <div className="container mx-auto space-y-6 p-8">
        <Skeleton className="h-[200px] w-full rounded-3xl" />
        <Skeleton className="h-[400px] w-full rounded-3xl" />
      </div>
    )
  }
  if (!page) {
    return <NotFoundLayout reason="This page hasn't been published yet." />
  }

  const themeColor = clinic.themeColor?.trim() || DEFAULT_THEME
  const routeId = clinic.slug ?? id

  return (
    <div className="bg-white">
      <ClinicHeader clinic={clinic} themeColor={themeColor} routeId={routeId} onOpenHub={openHub} />

      <SiteSectionList
        sections={page.sectionsJson ?? []}
        ctx={{
          themeColor,
          services: services as unknown as undefined,
          providers: providers as unknown as undefined,
        }}
      />

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

function NotFoundLayout({ reason }: { reason: string }) {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="inline-flex rounded-full bg-rose-50 p-4 text-rose-600">
        <Building2 className="h-10 w-10" />
      </div>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Page not available</h1>
      <p className="mt-2 text-sm text-slate-500">{reason}</p>
    </div>
  )
}
