'use client'

/**
 * DayInTheLife — chapter 5 of the narrative.
 *
 * Role: show how the product actually flows through a real day.
 * Layout: vertical timeline on a navy canvas. Each step is a white card
 * "hanging" off the timeline. This is deliberately the most distinctive
 * visual moment of the page.
 */

import React from 'react'
import { motion } from 'framer-motion'
import { BrainCircuit, Mic, CreditCard, CalendarCheck, Wallet, Sun } from 'lucide-react'
import { fadeUpInView, SectionHeader } from './primitives'

type Step = {
  time: string
  title: string
  description: string
  outcome: string
  icon: React.ElementType
  detail?: React.ReactNode
}

const steps: Step[] = [
  {
    time: '08:00',
    title: 'Morning brief',
    description:
      'Medoflow opens with today\u2019s schedule, flagged charts, and the AI summary for your first three patients.',
    outcome: 'Ready before coffee.',
    icon: Sun,
    detail: (
      <MiniCard label="Today\u2019s brief">
        <p className="text-[12px] text-ink">
          <span className="font-medium">3 new intake forms</span> &middot; 2 lab reports received
          overnight &middot; Mrs. Watson&rsquo;s medication review is due.
        </p>
      </MiniCard>
    ),
  },
  {
    time: '10:30',
    title: 'The visit',
    description:
      'Speak naturally. Medoflow drafts the SOAP note, orders labs, schedules follow-up, and flags any red-flag symptoms in real time.',
    outcome: 'Documentation done in-session.',
    icon: Mic,
    detail: (
      <MiniCard label="Recording &middot; live">
        <div className="flex items-center gap-1.5">
          {[3, 4, 2, 5, 3, 2, 4, 1, 2, 3].map((h, i) => (
            <motion.span
              key={i}
              animate={{ height: [4, h * 3, 4] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.06, ease: 'easeInOut' }}
              className="block w-[3px] rounded-full bg-teal"
            />
          ))}
        </div>
        <p className="mt-2 text-[11.5px] text-ink-muted">00:12:04 &middot; Dr. Chen + Sarah M.</p>
      </MiniCard>
    ),
  },
  {
    time: '10:52',
    title: 'Checkout',
    description:
      'Patient pays, picks up recommended products, and books a 2-week follow-up from the same tap-to-pay screen.',
    outcome: 'Patient leaves fully set.',
    icon: CreditCard,
    detail: (
      <MiniCard label="Order #4029">
        <p className="mf-display text-[20px] text-navy">$109.97</p>
        <p className="text-[11.5px] text-ink-muted">
          Consult + Vitamin D3 + follow-up booked for 2 weeks
        </p>
      </MiniCard>
    ),
  },
  {
    time: '16:45',
    title: 'Afternoon rhythm',
    description:
      'Between visits, Medoflow auto-confirms tomorrow\u2019s appointments, nudges no-response patients, and reconciles this morning\u2019s payments.',
    outcome: 'No manual catch-up required.',
    icon: CalendarCheck,
  },
  {
    time: '18:00',
    title: 'Close of day',
    description:
      'Charts are signed, revenue is reconciled, and tomorrow is pre-loaded. You walk out at 6:00 &mdash; not 11:00.',
    outcome: 'Log off with a clean inbox.',
    icon: Wallet,
  },
]

export function DayInTheLifeSection() {
  return (
    <section id="how-it-works" className="mf-zone-navy relative overflow-hidden py-28 md:py-36">
      <div className="absolute inset-0 mf-grid-pattern opacity-40" aria-hidden />
      <div
        className="absolute left-1/2 top-[10%] h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-[200px]"
        style={{ backgroundColor: 'rgba(13, 148, 136, 0.18)' }}
        aria-hidden
      />

      <div className="container relative z-10 mx-auto px-6">
        <SectionHeader
          onNavy
          eyebrow="A day in the clinic"
          title={
            <>
              One Tuesday. <span className="text-white/55">No switches.</span>
            </>
          }
          description="What it actually looks like when intake, charting, commerce, and billing live on one surface."
        />

        {/* ─── Timeline ─────────────────────────────────────────── */}
        <div className="mx-auto mt-20 max-w-3xl">
          <div className="relative">
            {/* vertical rail */}
            <div
              className="absolute left-[18px] top-2 h-[calc(100%-20px)] w-px bg-white/15 md:left-1/2"
              aria-hidden
            />

            {steps.map((s, i) => (
              <TimelineStep key={s.time} step={s} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────── Pieces ──────────────────────────────────

function TimelineStep({ step, index }: { step: Step; index: number }) {
  const Icon = step.icon
  const side = index % 2 === 0 ? 'left' : 'right'

  return (
    <motion.div
      {...fadeUpInView(index * 0.06)}
      className="relative pb-14 last:pb-0 md:grid md:grid-cols-2 md:gap-10"
    >
      {/* Node */}
      <div className="absolute left-[10px] top-1 flex h-4 w-4 items-center justify-center md:left-1/2 md:-translate-x-1/2">
        <span className="h-2 w-2 rounded-full bg-teal-bright" />
        <span
          className="absolute h-4 w-4 rounded-full border border-teal-bright/40"
          style={{ boxShadow: '0 0 0 4px rgba(30,58,95,1)' }}
        />
      </div>

      {/* Content */}
      <div
        className={`pl-12 md:pl-0 ${
          side === 'left' ? 'md:col-start-1 md:pr-12 md:text-right' : 'md:col-start-2 md:pl-12'
        }`}
      >
        <p className="mf-eyebrow text-white/50">{step.time}</p>
        <h3 className="mf-display mt-2 text-[22px] text-white md:text-[24px]">{step.title}</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-white/65">{step.description}</p>
        <p
          className={`mt-3 inline-flex items-center gap-2 text-[12.5px] font-medium text-teal-bright ${
            side === 'left' ? 'md:flex-row-reverse' : ''
          }`}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
          {step.outcome}
        </p>

        {step.detail && (
          <div className={`mt-5 ${side === 'left' ? 'md:ml-auto' : ''} inline-block text-left`}>
            {step.detail}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function MiniCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mf-card inline-block p-4 text-left">
      <p className="mf-eyebrow text-ink-muted">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  )
}
