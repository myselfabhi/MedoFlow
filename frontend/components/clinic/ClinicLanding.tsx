'use client'

/**
 * ClinicLanding — Marketing-style landing page for a generated clinic site.
 *
 * Structure mirrors Medoflow's own landing (hero → trust → why-us →
 * testimonial → final CTA → footer) so a generated clinic site feels like
 * a real clinic website rather than a directory.
 *
 * Visibility rule: services and providers are private. Logged-out visitors
 * see hero, trust band, generic value props, testimonial, and a final CTA
 * to sign in / sign up. Real clinic data only renders post-login.
 */

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarCheck,
  ChevronRight,
  Clock,
  Heart,
  MapPin,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  Wallet,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/components/auth/AuthModal'
import { getMyAppointments } from '@/lib/patientApi'
import type { Clinic, Service, Provider, Location } from '@/lib/types/booking'

const TESTIMONIAL = {
  quote:
    'Booking online took two minutes and the receptionist already had my history when I walked in. Felt cared for end to end.',
  author: 'Riya K.',
  role: 'Patient · since 2024',
}

const VALUE_PROPS: Array<{ icon: React.ComponentType<{ className?: string }>; title: string; body: string }> = [
  {
    icon: CalendarCheck,
    title: 'Same-day scheduling',
    body: 'Reserve a visit in under a minute. We confirm by email and SMS so you never miss the window.',
  },
  {
    icon: ShieldCheck,
    title: 'Private and secure',
    body: 'Your records are encrypted at rest and in transit. We follow HIPAA-aligned data handling end to end.',
  },
  {
    icon: Heart,
    title: 'Care that listens',
    body: 'Every clinician runs an unhurried first visit so we understand the full picture before we treat.',
  },
  {
    icon: Wallet,
    title: 'Transparent pricing',
    body: 'See the cost upfront, before you book. No hidden fees, no surprise bills after the visit.',
  },
]

export function ClinicLanding({
  clinic,
  services,
  providers,
  primaryLocation,
  themeColor,
  onBook,
}: {
  clinic: Clinic
  services: Service[] | undefined
  providers: Provider[] | undefined
  primaryLocation: Location | null
  themeColor: string
  onBook: (serviceId: string) => void
}) {
  const { isAuthenticated, user } = useAuth()
  const { openLogin, openSignup } = useAuthModal()
  const isPatient = user?.role === 'PATIENT'
  const showPrivate = isAuthenticated && isPatient

  const accentBg = `${themeColor}15`
  const accentBorder = `${themeColor}30`

  // Pull the patient's next upcoming appointment so the hero can flip
  // from "Book your visit" to "Your visit on Tue, 3:30 PM" — closes
  // the loop for returning patients.
  const { data: appointments } = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: () => getMyAppointments(),
    enabled: showPrivate,
  })
  const nextAppointment = React.useMemo(() => {
    if (!appointments) return null
    const now = Date.now()
    return (
      [...appointments]
        .filter((a) => new Date(a.startTime).getTime() > now && a.status !== 'CANCELLED')
        .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime))[0] ?? null
    )
  }, [appointments])

  // Three "available this week" preview pills shown to guest visitors.
  // Visual-only — the pills don't expose service or provider names, just
  // signal "booking is real". Tapping any pill opens the signup modal.
  const previewSlots = React.useMemo(() => {
    const out: Array<{ label: string }> = []
    const base = new Date()
    const formatter = new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    })
    const offsets = [
      { days: 1, hour: 9 },
      { days: 2, hour: 14, min: 30 },
      { days: 3, hour: 16 },
    ]
    for (const o of offsets) {
      const d = new Date(base)
      d.setDate(d.getDate() + o.days)
      d.setHours(o.hour, o.min ?? 0, 0, 0)
      out.push({ label: formatter.format(d) })
    }
    return out
  }, [])

  return (
    <div className="bg-white">
      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at 15% 0%, ${themeColor}30 0%, transparent 55%), radial-gradient(circle at 85% 30%, ${themeColor}15 0%, transparent 50%)`,
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 lg:px-8 lg:py-28">
          <div className="max-w-3xl">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]"
              style={{ color: themeColor, backgroundColor: accentBg, borderColor: accentBorder }}
            >
              <Sparkles className="h-3 w-3" />
              Welcome to {clinic.name}
            </div>
            {nextAppointment ? (
              <>
                <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight text-slate-900 lg:text-6xl">
                  See you soon,{' '}
                  <span style={{ color: themeColor }}>
                    {user?.name?.split(' ')[0] ?? 'friend'}.
                  </span>
                </h1>
                <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-slate-600">
                  Your next visit at {clinic.name} is coming up. Need to make changes? Open
                  your account from the menu.
                </p>
                <div
                  className="mt-8 inline-flex max-w-xl flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:gap-6"
                  style={{ borderColor: accentBorder }}
                >
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
                    style={{ backgroundColor: themeColor }}
                  >
                    <CalendarCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[10px] font-black uppercase tracking-widest"
                      style={{ color: themeColor }}
                    >
                      Your next visit
                    </p>
                    <p className="mt-1 text-base font-bold text-slate-900">
                      {nextAppointment.service.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(nextAppointment.startTime).toLocaleString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}{' '}
                      · Dr. {nextAppointment.provider.firstName}{' '}
                      {nextAppointment.provider.lastName}
                    </p>
                  </div>
                  <a
                    href="#services"
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-slate-200 px-4 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Book another
                  </a>
                </div>
              </>
            ) : (
              <>
                <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight text-slate-900 lg:text-6xl">
                  Care that fits<br />
                  your life — <span style={{ color: themeColor }}>not the other way around.</span>
                </h1>
                <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-slate-600">
                  {clinic.name} brings clinicians, scheduling, and follow-up into one calm
                  experience. Book online in minutes. Walk in to a team that already knows you.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  {showPrivate ? (
                    <a
                      href="#services"
                      className="inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90"
                      style={{ backgroundColor: themeColor }}
                    >
                      Book your visit <ChevronRight className="h-4 w-4" />
                    </a>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={openSignup}
                        className="inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90"
                        style={{ backgroundColor: themeColor }}
                      >
                        Sign up to book <ChevronRight className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={openLogin}
                        className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-50"
                      >
                        I already have an account
                      </button>
                    </>
                  )}
                </div>
                {!showPrivate && previewSlots.length > 0 && (
                  <div className="mt-8 max-w-xl">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Available this week
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {previewSlots.map((slot) => (
                        <button
                          key={slot.label}
                          type="button"
                          onClick={openSignup}
                          className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:shadow-sm"
                          style={{ borderColor: accentBorder }}
                        >
                          <Clock className="h-3.5 w-3.5" style={{ color: themeColor }} />
                          {slot.label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-slate-400">
                      Tap a time to start booking — sign up takes a few seconds.
                    </p>
                  </div>
                )}
              </>
            )}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-bold uppercase tracking-widest text-slate-400">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Verified facility
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarCheck className="h-3.5 w-3.5" style={{ color: themeColor }} />
                Same-day visits
              </span>
              <span className="inline-flex items-center gap-2">
                <Wallet className="h-3.5 w-3.5 text-slate-500" />
                Transparent pricing
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST BAND ────────────────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4 lg:px-8">
          {[
            { value: '24/7', label: 'Online booking' },
            { value: '<10 min', label: 'Avg wait time' },
            { value: '4.9 / 5', label: 'Patient rating' },
            { value: '100%', label: 'Private records' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-black text-slate-900 sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── VALUE PROPS ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Why patients choose us
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900">
            A clinic visit, finally <span style={{ color: themeColor }}>on your terms.</span>
          </h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUE_PROPS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-100 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: accentBg, color: themeColor }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PRIVATE SECTIONS (services + providers) ──────────────────── */}
      {showPrivate ? (
        <>
          <section
            id="services"
            className="border-t border-slate-100 bg-slate-50 py-20 lg:py-24"
          >
            <div className="mx-auto max-w-7xl px-4 lg:px-8">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    Service catalog
                  </p>
                  <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900">
                    Book a visit
                  </h2>
                </div>
              </div>
              <div className="mt-10 grid gap-4">
                {services?.map((svc) => (
                  <div
                    key={svc.id}
                    className="flex flex-col gap-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between lg:p-8"
                  >
                    <div className="flex items-start gap-6">
                      <div
                        className="hidden h-14 w-14 items-center justify-center rounded-2xl sm:flex"
                        style={{ backgroundColor: accentBg, color: themeColor }}
                      >
                        <Stethoscope className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{svc.name}</h3>
                        <div className="mt-2 flex items-center gap-4 text-sm font-medium text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-4 w-4" /> {svc.duration} minutes
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Wallet className="h-4 w-4" /> ${svc.defaultPrice}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onBook(svc.id)}
                      className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: themeColor }}
                    >
                      Book now <ChevronRight className="ml-1.5 h-4 w-4" />
                    </button>
                  </div>
                ))}
                {(!services || services.length === 0) && (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white py-12 text-center text-sm font-medium text-slate-400">
                    No clinical services are currently listed.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="py-20 lg:py-24">
            <div className="mx-auto max-w-7xl px-4 lg:px-8">
              <div className="max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Our team
                </p>
                <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900">
                  Clinicians who actually have time for you
                </h2>
              </div>
              {providers && providers.length === 0 ? (
                <div className="mt-10 rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center font-medium text-slate-400">
                  Providers will be available soon.
                </div>
              ) : (
                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {providers?.map((provider) => (
                    <div
                      key={provider.id}
                      className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                          <Users className="h-7 w-7 text-slate-300" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-slate-900">
                            Dr. {provider.firstName} {provider.lastName}
                          </p>
                          <p
                            className="text-[11px] font-bold uppercase tracking-wider"
                            style={{ color: themeColor }}
                          >
                            {provider.disciplines?.[0]?.discipline.name || 'Specialist'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        <section className="border-t border-slate-100 bg-slate-50 py-20 lg:py-24">
          <div className="mx-auto max-w-3xl px-4 text-center lg:px-8">
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ backgroundColor: accentBg, color: themeColor }}
            >
              <CalendarCheck className="h-6 w-6" />
            </div>
            <h2 className="mt-6 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              See services and book in one tap
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-500">
              Sign in to view our full service list, pick a clinician, and lock in your visit.
              Already a patient? Welcome back.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={openSignup}
                className="inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90"
                style={{ backgroundColor: themeColor }}
              >
                Create patient account
              </button>
              <button
                type="button"
                onClick={openLogin}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-50"
              >
                Sign in
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ─── TESTIMONIAL ───────────────────────────────────────────────── */}
      <section className="border-t border-slate-100 py-20 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Patient story
          </p>
          <p className="mt-6 text-2xl font-medium leading-snug text-slate-800 sm:text-3xl">
            “{TESTIMONIAL.quote}”
          </p>
          <p className="mt-6 text-sm font-bold text-slate-900">{TESTIMONIAL.author}</p>
          <p className="text-xs uppercase tracking-widest text-slate-400">{TESTIMONIAL.role}</p>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden border-t border-slate-100 py-20 lg:py-24"
        style={{ backgroundColor: themeColor }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.15) 0%, transparent 50%)',
          }}
        />
        <div className="relative mx-auto max-w-3xl px-4 text-center lg:px-8">
          <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            Ready when you are.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/85">
            {primaryLocation?.name
              ? `Visit us at ${primaryLocation.name}, or jump online for a video consult.`
              : 'In-clinic and video consults available — book whatever fits your day.'}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {showPrivate ? (
              <a
                href="#services"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold shadow-md transition-opacity hover:opacity-90"
                style={{ color: themeColor }}
              >
                Book a visit <ChevronRight className="h-4 w-4" />
              </a>
            ) : (
              <button
                type="button"
                onClick={openSignup}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold shadow-md transition-opacity hover:opacity-90"
                style={{ color: themeColor }}
              >
                Sign up free <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
