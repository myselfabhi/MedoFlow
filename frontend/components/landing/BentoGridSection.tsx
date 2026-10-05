'use client'

/**
 * BentoGridSection — the four pillars.
 *
 * Each card is a LIVE product surface — not a marketing tile. The user
 * should look at this and think "that's the actual product." Each card
 * has its own micro-animation showing the feature working.
 */

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Mic,
  Calendar as CalendarIcon,
  CreditCard,
  Smartphone,
  Check,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { SectionHeader } from './primitives'

export function BentoGridSection() {
  return (
    <section id="how-it-works" className="mf-zone-white relative py-28 md:py-36">
      <div className="container mx-auto px-6">
        <SectionHeader
          eyebrow="The four pillars"
          title={
            <>
              Four products. <span className="text-ink-muted">One platform.</span>
            </>
          }
          description="Charting, scheduling, payments, and a patient experience — built to operate as one system, not four apps stitched together."
        />

        <div className="mx-auto mt-20 grid max-w-6xl grid-cols-1 gap-5 md:auto-rows-[360px] md:grid-cols-3">
          <AIScribeCard />
          <SchedulingCard />
          <PaymentsCard />
          <PatientAppCard />
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────── 1 · AI Scribe (large) ──────────────────────

function AIScribeCard() {
  const [typed, setTyped] = useState('')
  const fullText =
    'Patient reports 30% reduction in lower-back pain since last visit. Mobility improved, sleeping through the night. Continue current PT protocol; add foam-roll routine. Re-eval in 2 weeks.'

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      setTyped(fullText.slice(0, i))
      i++
      if (i > fullText.length) {
        setTimeout(() => {
          i = 0
          setTyped('')
        }, 4000)
      }
    }, 26)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-hairline bg-white p-7 shadow-card transition-shadow hover:shadow-card-hover md:col-span-2"
    >
      {/* Soft teal aura on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at top right, rgba(13, 148, 136, 0.08), transparent 70%)',
        }}
        aria-hidden
      />

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between">
          <div>
            <p className="mf-eyebrow text-teal">Pillar 01 · AI Scribe</p>
            <h3 className="mf-display mt-2 text-[24px] text-ink">The note writes itself.</h3>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal text-white">
            <Mic className="h-4 w-4" strokeWidth={2} />
          </span>
        </div>

        <p className="mt-3 max-w-md text-[14px] leading-relaxed text-ink-muted">
          Ambient listening, structured SOAP output. Provider reviews, edits, approves — done in 90
          seconds instead of 15 minutes.
        </p>

        {/* Live note preview */}
        <div className="mt-5 flex-1 rounded-xl bg-canvas p-5 ring-1 ring-hairline">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Recording · 04:12
              </span>
            </div>
            <span className="rounded-full bg-teal-wash px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal">
              SOAP · Assessment
            </span>
          </div>
          <p className="font-mono text-[13px] leading-relaxed text-ink">
            {typed}
            <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-teal" />
          </p>
        </div>
      </div>
    </motion.article>
  )
}

// ─────────────────────────── 2 · Scheduling ────────────────────────────

function SchedulingCard() {
  const slots = [
    { time: '9:00', name: 'Sarah Mitchell', type: 'Wellness check', tone: 'confirmed' },
    { time: '10:30', name: 'James Rodriguez', type: 'Follow-up', tone: 'in-room' },
    { time: '11:45', name: 'Emily Watson', type: 'Consultation', tone: 'confirmed' },
    { time: '1:30', name: 'Open', type: 'Smart-filled from waitlist', tone: 'auto' },
  ] as const

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-hairline bg-navy p-7 text-white shadow-card transition-shadow hover:shadow-card-hover"
    >
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(94,234,212,0.4), transparent 70%)' }}
        aria-hidden
      />

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between">
          <div>
            <p className="mf-eyebrow text-teal-bright">Pillar 02 · Scheduling</p>
            <h3 className="mf-display mt-2 text-[22px] text-white">Booked. Reminded. Re-filled.</h3>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-teal-bright">
            <CalendarIcon className="h-4 w-4" strokeWidth={2} />
          </span>
        </div>

        <div className="mt-5 flex-1 space-y-1.5">
          {slots.map((slot, i) => (
            <motion.div
              key={slot.time}
              initial={{ opacity: 0, x: -6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-[12px] ${
                slot.tone === 'auto'
                  ? 'border border-dashed border-teal-bright/40 bg-teal-bright/[0.06]'
                  : 'bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-white/60">{slot.time}</span>
                <div>
                  <p className="font-medium text-white">{slot.name}</p>
                  <p className="text-[10px] text-white/50">{slot.type}</p>
                </div>
              </div>
              {slot.tone === 'auto' ? (
                <span className="rounded-full bg-teal-bright/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-teal-bright">
                  Auto-filled
                </span>
              ) : (
                <Check className="h-3 w-3 text-teal-bright" strokeWidth={2.5} />
              )}
            </motion.div>
          ))}
        </div>

        <p className="mt-4 text-[11px] text-white/60">
          ML predicts no-shows, waitlist auto-fills the slot.
        </p>
      </div>
    </motion.article>
  )
}

// ─────────────────────────── 3 · Payments ──────────────────────────────

function PaymentsCard() {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-hairline bg-white p-7 shadow-card transition-shadow hover:shadow-card-hover"
    >
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between">
          <div>
            <p className="mf-eyebrow text-teal">Pillar 03 · Payments</p>
            <h3 className="mf-display mt-2 text-[22px] text-ink">Charged. Paid. Reconciled.</h3>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-wash text-teal">
            <CreditCard className="h-4 w-4" strokeWidth={2} />
          </span>
        </div>

        {/* Live receipt */}
        <div className="mt-5 flex-1 rounded-xl bg-canvas p-4 ring-1 ring-hairline">
          <div className="mb-3 flex items-center justify-between border-b border-hairline pb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Invoice #INV-1042
            </p>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
              Paid · 2 min ago
            </span>
          </div>
          <div className="space-y-1.5 text-[12px]">
            <div className="flex justify-between text-ink">
              <span>Initial assessment · 60 min</span>
              <span>$185.00</span>
            </div>
            <div className="flex justify-between text-ink">
              <span>5-session package</span>
              <span>$650.00</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Membership discount (20%)</span>
              <span>−$130.00</span>
            </div>
            <div className="my-2 h-px bg-hairline" />
            <div className="flex justify-between text-[13px] font-semibold text-ink">
              <span>Total</span>
              <span>$705.00</span>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="mt-2 flex items-center gap-1.5 rounded-md bg-teal-wash px-2 py-1.5 text-[10px] font-medium text-teal"
            >
              <Sparkles className="h-3 w-3" strokeWidth={2} />
              Commission auto-posted to Dr. Chen
            </motion.div>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

// ─────────────────────────── 4 · Patient App ───────────────────────────

function PatientAppCard() {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-hairline bg-gradient-to-br from-teal-wash to-white p-7 shadow-card transition-shadow hover:shadow-card-hover md:col-span-2"
    >
      <div className="relative flex h-full items-center justify-between gap-6">
        <div className="flex-1">
          <p className="mf-eyebrow text-teal">Pillar 04 · Patient Experience</p>
          <h3 className="mf-display mt-2 text-[24px] text-ink">
            Your patients book in 30 seconds.
            <br />
            <span className="text-ink-muted">Without calling.</span>
          </h3>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-ink-muted">
            A branded site, online booking, intake forms, telehealth, package balances, invoices —
            under your domain, in your colors. Your patients see "Atlas Physio." Never "MedoFlow."
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {['atlasphysio.com', 'Online booking', 'Telehealth', 'Patient portal'].map(
              (chip, i) => (
                <motion.span
                  key={chip}
                  initial={{ opacity: 0, y: 4 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.06 }}
                  className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-ink ring-1 ring-hairline"
                >
                  {chip}
                </motion.span>
              )
            )}
          </div>
        </div>

        {/* Phone mockup — booking flow */}
        <motion.div
          initial={{ opacity: 0, x: 20, rotate: 3 }}
          whileInView={{ opacity: 1, x: 0, rotate: -2 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="hidden md:block"
        >
          <div
            className="relative h-[240px] w-[140px] rounded-[28px] bg-navy p-2 shadow-card-hover"
            style={{ boxShadow: '0 20px 50px -15px rgba(30, 58, 95, 0.4)' }}
          >
            <div className="h-full w-full overflow-hidden rounded-[22px] bg-white">
              <div className="flex items-center gap-1.5 bg-canvas px-3 py-2 ring-1 ring-hairline">
                <Smartphone className="h-2.5 w-2.5 text-ink-muted" strokeWidth={2} />
                <span className="text-[8px] font-medium text-ink-muted">atlasphysio.com</span>
              </div>
              <div className="px-3 py-3">
                <p className="mf-display text-[11px] text-navy">Atlas Physio</p>
                <p className="text-[7px] text-ink-muted">Pick a time that works</p>
                <div className="mt-2 grid grid-cols-3 gap-1">
                  {['9:00', '10:30', '11:45', '1:30', '2:45', '4:00'].map((t, i) => (
                    <button
                      key={t}
                      className={`rounded px-1 py-1 text-[8px] font-medium ${
                        i === 4
                          ? 'bg-teal text-white'
                          : 'border border-hairline bg-white text-ink-muted'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <button className="mt-3 w-full rounded-md bg-navy px-2 py-1.5 text-[8px] font-semibold text-white">
                  Confirm booking
                </button>
                <div className="mt-2 flex items-center justify-center gap-1 text-[7px] text-emerald-600">
                  <TrendingUp className="h-2 w-2" strokeWidth={2.5} />
                  +23% more bookings
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.article>
  )
}
