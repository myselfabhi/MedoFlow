'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Plus, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { OnboardingShell } from '@/components/onboarding/OnboardingShell'
import { AppFormField, AppInput } from '@/components/ui-system'

interface LocationDraft {
  id?: string // existing id from DB, if already persisted
  name: string
  addressLine1: string
  city: string
  state: string
  postalCode: string
  phone: string
  timezone: string
}

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'UTC',
] as const

function emptyLocation(): LocationDraft {
  return {
    name: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
    timezone: 'America/New_York',
  }
}

export default function LocationsStepPage() {
  const router = useRouter()
  const [drafts, setDrafts] = React.useState<LocationDraft[]>([emptyLocation()])
  const [isLoading, setIsLoading] = React.useState(true)

  // Pre-populate from existing locations (e.g. the auto-created "Main Location")
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api.get('/locations')
        const existing = data?.data?.locations ?? data?.data ?? []
        if (!cancelled && Array.isArray(existing) && existing.length > 0) {
          setDrafts(
            existing.map((loc: any) => ({
              id: loc.id,
              name: loc.name ?? '',
              addressLine1: loc.addressLine1 ?? loc.address ?? '',
              city: loc.city ?? '',
              state: loc.state ?? '',
              postalCode: loc.postalCode ?? '',
              phone: loc.phone ?? '',
              timezone: loc.timezone ?? 'America/New_York',
            }))
          )
        }
      } catch {
        /* fine — keep default empty draft */
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const updateDraft = (idx: number, patch: Partial<LocationDraft>) => {
    setDrafts((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)))
  }

  const addDraft = () => setDrafts((prev) => [...prev, emptyLocation()])
  const removeDraft = (idx: number) => setDrafts((prev) => prev.filter((_, i) => i !== idx))

  const allValid = drafts.every((d) => d.name.trim().length > 0 && d.timezone)

  return (
    <OnboardingShell
      stepKey="locations"
      title="Where do you operate?"
      subtitle="Add your clinic location. You can add more locations later from the dashboard."
      nextLabel="Save & continue"
      nextDisabled={!allValid || isLoading}
      onNext={async () => {
        for (const d of drafts) {
          const payload = {
            name: d.name.trim(),
            addressLine1: d.addressLine1.trim() || undefined,
            city: d.city.trim() || undefined,
            state: d.state.trim() || undefined,
            postalCode: d.postalCode.trim() || undefined,
            phone: d.phone.trim() || undefined,
            timezone: d.timezone,
          }
          if (d.id) {
            await api.patch(`/locations/${d.id}`, payload)
          } else {
            await api.post('/locations', payload)
          }
        }
        await api.patch('/onboarding/step', { step: 3 })
        router.push('/disciplines')
      }}
    >
      <div className="space-y-6">
        {drafts.map((d, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-100 bg-slate-50/30 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Location {idx + 1}</p>
                </div>
              </div>
              {drafts.length > 1 && !d.id && (
                <button
                  type="button"
                  onClick={() => removeDraft(idx)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <AppFormField label="Name" required>
                <AppInput
                  value={d.name}
                  onChange={(e) => updateDraft(idx, { name: e.target.value })}
                  placeholder="Downtown Clinic"
                />
              </AppFormField>
              <AppFormField label="Phone">
                <AppInput
                  value={d.phone}
                  onChange={(e) => updateDraft(idx, { phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </AppFormField>
              <AppFormField label="Street address" className="md:col-span-2">
                <AppInput
                  value={d.addressLine1}
                  onChange={(e) => updateDraft(idx, { addressLine1: e.target.value })}
                  placeholder="123 Main Street"
                />
              </AppFormField>
              <AppFormField label="City">
                <AppInput
                  value={d.city}
                  onChange={(e) => updateDraft(idx, { city: e.target.value })}
                  placeholder="New York"
                />
              </AppFormField>
              <AppFormField label="State / Region">
                <AppInput
                  value={d.state}
                  onChange={(e) => updateDraft(idx, { state: e.target.value })}
                  placeholder="NY"
                />
              </AppFormField>
              <AppFormField label="Postal code">
                <AppInput
                  value={d.postalCode}
                  onChange={(e) => updateDraft(idx, { postalCode: e.target.value })}
                  placeholder="10001"
                />
              </AppFormField>
              <AppFormField label="Timezone" required>
                <select
                  value={d.timezone}
                  onChange={(e) => updateDraft(idx, { timezone: e.target.value })}
                  className="flex h-10 w-full rounded-[12px] border border-slate-200/80 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </AppFormField>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addDraft}
          className="inline-flex items-center gap-2 rounded-full border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-indigo-400 hover:text-indigo-700"
        >
          <Plus className="h-4 w-4" /> Add another location
        </button>
      </div>
    </OnboardingShell>
  )
}
