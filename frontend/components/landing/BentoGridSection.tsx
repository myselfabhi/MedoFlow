'use client'

/**
 * BentoGridSection — chapter 4 of the narrative.
 *
 * Role: solution unveiled. Four pillars replace all the chaos tools from
 * the previous section. Each card is a miniature live product surface —
 * not a marketing tile.
 */

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Mic,
  DollarSign,
  Truck,
  Calendar as CalendarIcon,
  FileText,
  Sparkles,
  ShieldCheck,
  BellRing,
  CreditCard,
  ArrowUpRight,
} from 'lucide-react'
import { fadeUpInView, SectionHeader } from './primitives'

export function BentoGridSection() {
  return (
    <section className="mf-zone-white relative py-28 md:py-36">
      {/* Section separator — subtle arrow hinting continuation of the story */}
      <div className="container mx-auto px-6">
        <div className="flex justify-center">
          <div className="mb-14 flex flex-col items-center gap-3">
            <div className="h-10 w-px bg-hairline" aria-hidden />
            <p className="mf-eyebrow">Medoflow replaces all of it with</p>
          </div>
        </div>

        <SectionHeader
          title={
            <>
              Four pillars. <span className="text-ink-muted">One surface.</span>
            </>
          }
          description="Charting, patient experience, commerce, and scheduling &mdash; built to operate as one system, not four apps."
        />

        <div className="mx-auto mt-20 grid max-w-6xl grid-cols-1 gap-5 md:auto-rows-[320px] md:grid-cols-3">
          <ScribeCard />
          <PatientAppCard />
          <CommerceCard />
          <SchedulingCard />
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────── Pillar 1 · AI Scribe ────────────────────

function ScribeCard() {
  const [typed, setTyped] = useState('')
  const text = 'SOAP complete: pain down 30%, mobility improved, home protocol sent.'

  useEffect(() => {
    let i = 0
    const t = setInterval(() => {
      setTyped(text.slice(0, i))
      i++
      if (i > text.length) clearInterval(t)
    }, 34)
    return () => clearInterval(t)
  }, [])

  return (
    <motion.article {...fadeUpInView(0)} className="mf-card mf-card--hover p-7 md:col-span-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="mf-eyebrow">Pillar 01</p>
          <h3 className="mf-display mt-2 text-[24px] text-ink">Ambient AI Scribe</h3>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed text-ink-muted">
            Speak naturally during consultations. Medoflow drafts SOAP notes and prepares follow-up
            tasks in real time.
          </p>
        </div>
        <button className="mf-btn mf-btn-sm mf-btn-ghost -mr-3 -mt-1">
          Learn more <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-[1.35fr_1fr]">
        {/* Listening panel */}
        <div className="mf-card p-4">
          <div className="flex items-center justify-between">
            <span className="mf-eyebrow flex items-center gap-1.5">
              <Mic className="h-3 w-3" strokeWidth={2} />
              Listening
            </span>
            <span className="mf-dot mf-dot--ok" />
          </div>
          <div className="mt-4 flex h-6 items-center gap-1">
            {[1, 2, 3, 4, 2, 5, 3, 2, 4, 2, 3, 1, 2, 3].map((h, i) => (
              <motion.span
                key={i}
                animate={{ height: [4, h * 4, 4] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.06, ease: 'easeInOut' }}
                className="block w-[3px] rounded-full bg-teal"
              />
            ))}
          </div>
          <p className="mt-4 min-h-[2.2em] text-[12.5px] leading-relaxed text-ink">
            {typed}
            <span className="ml-0.5 inline-block h-3 w-[2px] animate-pulse bg-teal align-middle" />
          </p>
        </div>

        {/* Outputs */}
        <div className="mf-card p-4">
          <p className="mf-eyebrow text-ink-muted">Generated</p>
          <ul className="mt-3 space-y-2.5 text-[12.5px] text-ink">
            <ScribeOutput icon={FileText} label="SOAP note drafted" />
            <ScribeOutput icon={Sparkles} label="Follow-up plan suggested" />
            <ScribeOutput icon={ShieldCheck} label="Audit timeline stored" />
          </ul>
        </div>
      </div>
    </motion.article>
  )
}

function ScribeOutput({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-ink-faint" strokeWidth={1.75} />
      {label}
    </li>
  )
}

// ─────────────────────────── Pillar 2 · Patient App ──────────────────

function PatientAppCard() {
  return (
    <motion.article
      {...fadeUpInView(0.05)}
      className="mf-card mf-card--hover flex flex-col p-7 md:row-span-2"
    >
      <div>
        <p className="mf-eyebrow">Pillar 02</p>
        <h3 className="mf-display mt-2 text-[24px] text-ink">Patient App</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
          A clean mobile experience for booking, forms, reminders, and payments &mdash; no extra
          apps.
        </p>
      </div>

      <div className="mt-8 flex flex-1 items-end justify-center">
        <div className="w-[180px] rounded-[30px] bg-navy p-1.5">
          <div
            className="relative flex flex-col overflow-hidden rounded-[24px] bg-canvas"
            style={{ minHeight: 340 }}
          >
            <div className="absolute left-1/2 top-0 z-20 h-4 w-14 -translate-x-1/2 rounded-b-xl bg-navy" />
            <div className="bg-navy px-4 pb-3 pt-6">
              <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/70">
                Medoflow
              </p>
              <p className="mf-display mt-1 text-[14px] text-white">Hi, Sarah</p>
            </div>

            <div className="flex-1 space-y-2 p-2.5">
              <div className="mf-card p-3">
                <span className="mf-stat-chip" style={{ width: 22, height: 22 }}>
                  <CalendarIcon className="h-3 w-3" strokeWidth={1.75} />
                </span>
                <p className="mt-2 text-[9.5px] font-medium text-ink-muted">Upcoming</p>
                <p className="text-[10px] text-ink">Tue &middot; 10:30 AM</p>
              </div>

              <div className="mf-card p-3" style={{ borderColor: '#0D9488' }}>
                <p className="text-[8.5px] font-medium uppercase tracking-[0.14em] text-teal">
                  Next appointment
                </p>
                <p className="mt-1 text-[10px] font-medium text-ink">Tomorrow, 10:30 AM</p>
                <p className="mt-2 inline-flex items-center gap-1 text-[9px] text-ink-muted">
                  <span className="mf-dot mf-dot--ok" /> Forms completed
                </p>
              </div>

              <div className="mf-card p-3">
                <p className="flex items-center gap-1.5 text-[9.5px] text-ink-muted">
                  <CreditCard className="h-3 w-3" strokeWidth={1.75} />
                  Saved payment on file
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

// ─────────────────────────── Pillar 3 · Commerce ─────────────────────

function CommerceCard() {
  return (
    <motion.article {...fadeUpInView(0.1)} className="mf-card mf-card--hover flex flex-col p-7">
      <div>
        <p className="mf-eyebrow">Pillar 03</p>
        <h3 className="mf-display mt-2 text-[22px] text-ink">Commerce</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
          Turn recommendations into revenue &mdash; checkout, tracking, and fulfillment built in.
        </p>
      </div>

      <div className="mt-auto pt-5">
        <div className="flex items-baseline justify-between">
          <p className="mf-eyebrow text-ink-muted">Collected this week</p>
          <span className="flex items-center gap-1.5 text-[11px] text-teal">
            <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
            +12%
          </span>
        </div>
        <p className="mf-display mt-1 text-[28px] text-navy">$18,420</p>

        <ul className="mt-4 space-y-1.5 text-[12px] text-ink">
          <li className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-ink-faint" strokeWidth={1.75} />
              Payment &middot; Vitamin D Pack
            </span>
            <span className="text-ink-muted">$245</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Truck className="h-3.5 w-3.5 text-ink-faint" strokeWidth={1.75} />
              Shipped via USPS
            </span>
            <span className="mf-dot mf-dot--ok" />
          </li>
        </ul>
      </div>
    </motion.article>
  )
}

// ─────────────────────────── Pillar 4 · Scheduling ───────────────────

function SchedulingCard() {
  return (
    <motion.article {...fadeUpInView(0.15)} className="mf-card mf-card--hover flex flex-col p-7">
      <div>
        <p className="mf-eyebrow">Pillar 04</p>
        <h3 className="mf-display mt-2 text-[22px] text-ink">Smart scheduling</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
          Rule-based availability, automated reminders, and fewer no-shows.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <div className="mf-card p-3">
          <p className="mf-eyebrow text-ink-muted">Rebook rate</p>
          <p className="mf-display mt-1 text-[20px] text-navy">+27%</p>
        </div>
        <div className="mf-card p-3">
          <p className="mf-eyebrow text-ink-muted">No-shows</p>
          <p className="mf-display mt-1 text-[20px] text-navy">−18%</p>
        </div>
      </div>

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between">
          {['M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <span
              key={i}
              className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-faint"
            >
              {d}
            </span>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between">
          {[8, 9, 10, 11, 12, 13].map((day, i) => {
            const isToday = i === 0
            const isBooked = i < 4 && !isToday
            return (
              <span
                key={day}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium ${
                  isToday
                    ? 'bg-teal text-white'
                    : isBooked
                      ? 'bg-teal-wash text-teal-hover'
                      : 'text-ink-faint'
                }`}
              >
                {day}
              </span>
            )
          })}
        </div>
        <p className="mt-3 flex items-center gap-2 text-[11px] text-ink-muted">
          <BellRing className="h-3 w-3" strokeWidth={1.75} />
          Reminders sent automatically
        </p>
      </div>
    </motion.article>
  )
}
