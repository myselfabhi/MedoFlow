'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Calendar, FileText, Wallet, Sparkles } from 'lucide-react'
import { fadeUp, StatusChip } from './primitives'
import { useAuthModal } from '@/components/auth/AuthModal'

type PatientRow = {
  name: string
  type: string
  time: string
  status: string
  tone: 'ok' | 'warn' | 'err'
  avatar: string
}

const patientRows: PatientRow[] = [
  {
    name: 'Sarah Mitchell',
    type: 'Wellness check',
    time: '9:00 AM',
    status: 'Confirmed',
    tone: 'ok',
    avatar: '/doctors/doctor-female-1.jpg',
  },
  {
    name: 'James Rodriguez',
    type: 'Follow up',
    time: '10:30 AM',
    status: 'In room',
    tone: 'warn',
    avatar: '/doctors/doctor-male-1.jpg',
  },
  {
    name: 'Emily Watson',
    type: 'Consultation',
    time: '11:45 AM',
    status: 'Waiting',
    tone: 'ok',
    avatar: '/doctors/doctor-female-2.jpg',
  },
]

const stats = [
  { icon: Calendar, label: 'Appointments', value: '12' },
  { icon: FileText, label: 'Follow ups', value: '7' },
  { icon: Wallet, label: 'Revenue', value: '$4.2K' },
] as const

export function HeroSection() {
  const { openLogin } = useAuthModal()
  return (
    <section className="mf-zone-navy relative overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 mf-grid-pattern opacity-50" aria-hidden />
      <div
        className="absolute -top-40 right-0 h-[520px] w-[520px] rounded-full blur-[160px]"
        style={{ backgroundColor: 'rgba(13, 148, 136, 0.28)' }}
        aria-hidden
      />
      <div
        className="absolute -bottom-32 -left-20 h-[360px] w-[360px] rounded-full blur-[140px]"
        style={{ backgroundColor: 'rgba(94, 234, 212, 0.08)' }}
        aria-hidden
      />

      <div className="container relative z-10 mx-auto px-6 pt-28 pb-28 md:pt-32 md:pb-36">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-20">
          {/* ─── Left: story hook ─────────────────────────────────────── */}
          <div className="max-w-xl">
            <motion.div
              {...fadeUp(0.05)}
              className="mf-eyebrow inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5"
            >
              <Sparkles className="h-3 w-3" strokeWidth={2} style={{ color: '#5EEAD4' }} />
              <span className="text-white/70">New &middot; Ambient AI scribe</span>
            </motion.div>

            <motion.h1
              {...fadeUp(0.12)}
              className="mf-display mt-6 text-[44px] text-white sm:text-[56px] md:text-[68px]"
            >
              One timeline.
              <br />
              Every patient, <span className="text-teal-bright">every rupee,</span>
              <br />
              every detail.
            </motion.h1>

            <motion.p
              {...fadeUp(0.2)}
              className="mt-7 max-w-lg text-[17px] leading-relaxed text-white/70"
            >
              Medoflow runs your entire practice on a single surface &mdash; intake, charting,
              scheduling, commerce, billing. No tab-switching, no handoffs.
            </motion.p>

            <motion.div {...fadeUp(0.28)} className="mt-10 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={openLogin}
                className="mf-btn mf-btn-lg mf-btn-primary"
              >
                Clinic login
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link href="#how-it-works" className="mf-btn mf-btn-lg mf-btn-ghost">
                See how it works
              </Link>
            </motion.div>

            <motion.div
              {...fadeUp(0.36)}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3"
            >
              <StatusChip onNavy>No credit card</StatusChip>
              <StatusChip onNavy>14-day trial</StatusChip>
              <StatusChip onNavy>HIPAA &amp; SOC2 aligned</StatusChip>
            </motion.div>
          </div>

          {/* ─── Right: the product surface (workspace artifact in navy edge) ─ */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="relative lg:-mr-8"
          >
            {/* Card stack — offset sibling hints at "one timeline, multiple views" */}
            <div
              className="absolute inset-0 translate-x-4 translate-y-4 rounded-[14px] bg-white/5"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}
              aria-hidden
            />

            <div
              className="relative overflow-hidden rounded-[14px] border border-white/10 bg-canvas"
              style={{ boxShadow: '0 40px 80px -30px rgba(0,0,0,0.55)' }}
            >
              {/* Navy welcome bar = the "edge" inside the product */}
              <div className="flex items-center justify-between bg-navy px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/20">
                    <Image
                      src="/doctors/doctor-male-2.jpg"
                      alt=""
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                  <div className="leading-tight">
                    <p className="mf-display text-[15px] text-white">Welcome, Dr. Chen</p>
                    <p className="text-[11px] text-white/70">
                      Tuesday &middot; 12 appointments today
                    </p>
                  </div>
                </div>
                <div className="hidden items-center gap-2 rounded-full border border-white/20 px-2.5 py-1 sm:flex">
                  <span className="mf-dot mf-dot--ok" />
                  <span className="text-[11px] font-medium text-white">Online</span>
                </div>
              </div>

              {/* Workspace */}
              <div className="px-5 py-5">
                <div className="grid grid-cols-3 gap-3">
                  {stats.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="mf-card px-3.5 py-3">
                      <span className="mf-stat-chip">
                        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </span>
                      <p className="mf-display mt-2 text-[22px] leading-none text-navy">{value}</p>
                      <p className="mt-1 text-[11px] text-ink-muted">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="mf-card mt-3 overflow-hidden">
                  <div className="flex items-center justify-between bg-canvas px-4 py-2.5">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                      Today
                    </p>
                    <button className="mf-btn mf-btn-sm mf-btn-ghost -mr-2">Full calendar</button>
                  </div>
                  {patientRows.map((p, i) => (
                    <div
                      key={p.name}
                      className={`flex items-center justify-between px-4 py-3 ${
                        i !== patientRows.length - 1 ? 'border-b border-hairline' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-8 w-8 overflow-hidden rounded-full border border-hairline">
                          <Image src={p.avatar} alt="" fill sizes="32px" className="object-cover" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-ink">{p.name}</p>
                          <p className="text-[11px] text-ink-muted">{p.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[12px] font-medium text-ink">{p.time}</span>
                        <StatusChip tone={p.tone}>{p.status}</StatusChip>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating micro-notification */}
            <motion.div
              initial={{ opacity: 0, x: 16, y: -8 }}
              animate={{ opacity: 1, x: 0, y: [0, -4, 0] }}
              transition={{
                delay: 1,
                duration: 0.5,
                y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
              }}
              className="absolute -left-6 bottom-10 hidden items-center gap-3 rounded-[12px] border border-hairline bg-white px-3.5 py-2.5 md:flex"
              style={{ boxShadow: '0 20px 40px -20px rgba(0,0,0,0.35)' }}
            >
              <span className="mf-stat-chip bg-teal-wash text-teal">
                <Wallet className="h-3.5 w-3.5" strokeWidth={1.75} />
              </span>
              <div className="leading-tight">
                <p className="text-[12px] font-medium text-ink">Payment received</p>
                <p className="text-[11px] text-ink-muted">Sarah M. &middot; $185.00</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
