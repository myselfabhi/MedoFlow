'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, CheckCircle2, Copy } from 'lucide-react'
import api from '@/lib/api'

type Plan = 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE'

interface FormState {
  clinicName: string
  clinicEmail: string
  ownerName: string
  ownerEmail: string
  subdomain: string
  plan: Plan
}

interface CreateResponse {
  tenantId: string
  clinicId: string
  subdomain: string
  ownerEmail: string
  setupLink: string
}

export default function NewClinicPage() {
  const router = useRouter()
  const [form, setForm] = React.useState<FormState>({
    clinicName: '',
    clinicEmail: '',
    ownerName: '',
    ownerEmail: '',
    subdomain: '',
    plan: 'FREE',
  })
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [created, setCreated] = React.useState<CreateResponse | null>(null)
  const [copied, setCopied] = React.useState(false)

  const valid =
    form.clinicName.trim().length >= 2 &&
    /^\S+@\S+\.\S+$/.test(form.clinicEmail) &&
    form.ownerName.trim().length >= 2 &&
    /^\S+@\S+\.\S+$/.test(form.ownerEmail) &&
    /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(form.subdomain)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const { data } = await api.post<{ success: boolean; data: CreateResponse }>(
        '/platform/clinics',
        {
          clinicName: form.clinicName.trim(),
          clinicEmail: form.clinicEmail.trim(),
          ownerName: form.ownerName.trim(),
          ownerEmail: form.ownerEmail.trim(),
          subdomain: form.subdomain.trim(),
          plan: form.plan,
        }
      )
      setCreated(data.data)
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not create the clinic. Please try again.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (created) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">Clinic provisioned</h2>
          </div>
          <p className="mt-2 text-sm text-slate-700">
            We sent a setup invite to <strong>{created.ownerEmail}</strong>. They'll set their
            password, accept the agreement, and run through the onboarding wizard.
          </p>

          <div className="mt-4 rounded-lg border border-emerald-100 bg-white p-3 text-xs">
            <p className="font-semibold text-slate-700">Invite link (also emailed)</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-slate-50 px-2 py-1 font-mono text-xs text-slate-700">
                {created.setupLink}
              </code>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(created.setupLink)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                  } catch {
                    /* noop */
                  }
                }}
                className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700"
              >
                <Copy className="h-3 w-3" />
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => router.push(`/platform/clinics/${created.tenantId}`)}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              View clinic
            </button>
            <button
              type="button"
              onClick={() => {
                setCreated(null)
                setForm({
                  clinicName: '',
                  clinicEmail: '',
                  ownerName: '',
                  ownerEmail: '',
                  subdomain: '',
                  plan: 'FREE',
                })
              }}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Add another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/platform/clinics"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to clinics
      </Link>

      <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Add a new clinic</h1>
      <p className="mt-1 text-sm text-slate-600">
        Provision the tenant and email a one-time setup link to the clinic admin. They'll set their
        password, accept the agreement, and onboard from there.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <Section title="Clinic">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Clinic name" required>
              <input
                type="text"
                value={form.clinicName}
                onChange={(e) =>
                  setForm({
                    ...form,
                    clinicName: e.target.value,
                    subdomain:
                      form.subdomain ||
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '-')
                        .replace(/^-+|-+$/g, '')
                        .slice(0, 30),
                  })
                }
                className="input"
                placeholder="Acme Wellness"
                required
              />
            </Field>
            <Field label="Clinic contact email" required>
              <input
                type="email"
                value={form.clinicEmail}
                onChange={(e) => setForm({ ...form, clinicEmail: e.target.value })}
                className="input"
                placeholder="hello@acme.com"
                required
              />
            </Field>
            <Field label="Subdomain" required className="md:col-span-2">
              <div className="flex items-stretch overflow-hidden rounded-lg border border-slate-200 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200">
                <input
                  type="text"
                  value={form.subdomain}
                  onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase() })}
                  className="flex-1 px-3 py-2 text-sm focus:outline-none"
                  placeholder="acme-wellness"
                  required
                />
                <span className="bg-slate-50 px-3 py-2 text-sm text-slate-500">.medoflow.com</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Lowercase letters, numbers, hyphens. 3–63 chars.
              </p>
            </Field>
            <Field label="Plan">
              <select
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value as Plan })}
                className="input"
              >
                <option value="FREE">Free / Trial</option>
                <option value="STARTER">Starter</option>
                <option value="GROWTH">Growth</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Clinic admin (first user)">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Admin name" required>
              <input
                type="text"
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                className="input"
                placeholder="Dr. Priya Sharma"
                required
              />
            </Field>
            <Field label="Admin email" required>
              <input
                type="email"
                value={form.ownerEmail}
                onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                className="input"
                placeholder="priya@acme.com"
                required
              />
              <p className="mt-1 text-xs text-slate-500">The setup invite is sent here.</p>
            </Field>
          </div>
        </Section>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <Link
            href="/platform/clinics"
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!valid || submitting}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? 'Provisioning…' : 'Create & send invite'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: rgb(15 23 42);
        }
        .input:focus {
          outline: none;
          border-color: rgb(148 163 184);
          box-shadow: 0 0 0 3px rgb(226 232 240 / 0.6);
        }
      `}</style>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h2>
      {children}
    </div>
  )
}

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={`block text-sm ${className ?? ''}`}>
      <span className="mb-1 block font-medium text-slate-800">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
    </label>
  )
}
