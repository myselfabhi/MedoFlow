'use client'

/**
 * ChaosSection — chapter 3 of the narrative.
 *
 * Role: state the problem. Visually: disconnected tools drifting, broken
 * dashed lines between them, a raw quote, a cost-of-status-quo callout.
 * We intentionally don't show the "solution" here — the next section (Bento)
 * is the reveal.
 */

import React from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  Mail,
  CreditCard,
  Database,
  Activity,
  FileText,
  BellRing,
  MessagesSquare,
  Clock,
} from 'lucide-react'
import { fadeUpInView, SectionHeader } from './primitives'

type ToolIconProps = {
  icon: React.ReactNode
  top?: string
  left?: string
  right?: string
  bottom?: string
  delay?: number
  label: string
}

const tools: ToolIconProps[] = [
  { icon: <Mail />, top: '6%', left: '4%', delay: 0, label: 'Email' },
  { icon: <Calendar />, top: '2%', right: '22%', delay: 0.4, label: 'Calendly' },
  { icon: <Database />, top: '38%', left: '22%', delay: 0.8, label: 'Spreadsheet' },
  { icon: <MessagesSquare />, bottom: '28%', right: '6%', delay: 0.2, label: 'WhatsApp' },
  { icon: <CreditCard />, bottom: '8%', left: '8%', delay: 1.0, label: 'POS' },
  { icon: <Activity />, top: '30%', right: '4%', delay: 0.6, label: 'EMR' },
  { icon: <FileText />, bottom: '6%', right: '30%', delay: 1.4, label: 'Notes app' },
  { icon: <BellRing />, top: '58%', left: '48%', delay: 1.8, label: 'Reminders' },
]

export function ChaosToClaritySection() {
  return (
    <section className="mf-zone-white relative py-28 md:py-36">
      <div className="container mx-auto px-6">
        <SectionHeader
          eyebrow="The problem"
          title={
            <>
              Care is messy.{' '}
              <span className="text-ink-muted">
                The software you use to run it,
                <br className="hidden md:block" /> somehow messier.
              </span>
            </>
          }
          description="Most clinics stitch together 7–12 tools that don't talk. The result: staff playing human middleware, patients falling through cracks, revenue quietly leaking."
        />

        <div className="mx-auto mt-20 grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-14">
          {/* ─── Left: the chaos canvas ───────────────────────────── */}
          <motion.div {...fadeUpInView(0.1)} className="relative mx-auto h-[420px] w-full max-w-xl">
            {/* Dashed broken connectors (visual metaphor) */}
            <svg className="absolute inset-0 h-full w-full" aria-hidden>
              <defs>
                <pattern
                  id="chaos-dots"
                  x="0"
                  y="0"
                  width="16"
                  height="16"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="1" cy="1" r="0.8" fill="#E5E7EB" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#chaos-dots)" opacity="0.8" />
              {/* broken link fragments */}
              {[
                { x1: '12%', y1: '18%', x2: '44%', y2: '52%' },
                { x1: '76%', y1: '12%', x2: '54%', y2: '48%' },
                { x1: '56%', y1: '72%', x2: '14%', y2: '90%' },
                { x1: '88%', y1: '60%', x2: '60%', y2: '78%' },
                { x1: '30%', y1: '46%', x2: '70%', y2: '38%' },
              ].map((l, i) => (
                <line
                  key={i}
                  {...l}
                  stroke="#E5E7EB"
                  strokeWidth="1.25"
                  strokeDasharray="5 6"
                  strokeLinecap="round"
                />
              ))}
            </svg>

            {tools.map((t) => (
              <ToolChip key={t.label} {...t} />
            ))}

            {/* central "help" question */}
            <motion.div
              {...fadeUpInView(0.4)}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-4 py-1.5 text-[11px] font-medium text-ink-muted"
              style={{ border: '1px solid #E5E7EB' }}
            >
              <span className="mr-1.5" aria-hidden>
                ?
              </span>
              Where did that intake form go?
            </motion.div>
          </motion.div>

          {/* ─── Right: cost of status quo ────────────────────────── */}
          <div className="max-w-md">
            <motion.figure {...fadeUpInView(0.15)}>
              <svg
                className="mb-5 h-6 w-6 text-hairline"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path d="M14.017 21v-7.391C14.017 8.37 17.092 5.32 22 4v2.87c-2.52 1.35-3.79 3.38-3.79 5.77h3.79V21h-7.983zm-14.017 0v-7.391C.0 8.37 3.075 5.32 7.983 4v2.87c-2.52 1.35-3.79 3.38-3.79 5.77h3.79V21H0z" />
              </svg>
              <blockquote className="mf-display text-[22px] leading-snug text-navy md:text-[26px]">
                &ldquo;I finish charts at 11pm. My front desk texts patients from her personal
                phone. We lose a consult every week because no one reconciled the calendar.&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-[13px] text-ink-muted">
                &mdash; Dr. Priya Mehta, family medicine, Pune
              </figcaption>
            </motion.figure>

            <motion.div
              {...fadeUpInView(0.25)}
              className="mt-10 grid grid-cols-2 gap-4 rounded-[12px] border border-hairline bg-canvas p-5"
            >
              <CostStat value="11.4 hrs" label="Weekly admin swamp per provider" />
              <CostStat value="₹42K" label="Avg. monthly revenue leaked" />
              <CostStat value="24%" label="No-shows without reminders" />
              <CostStat value="7+ tools" label="Daily tab-switching tax" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ToolChip({ icon, top, left, right, bottom, delay = 0, label }: ToolIconProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: 0.1 + delay * 0.06, duration: 0.4 }}
      className="absolute"
      style={{ top, left, right, bottom }}
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 5 + (delay % 2), repeat: Infinity, ease: 'easeInOut', delay }}
        className="flex items-center gap-2 rounded-[10px] border border-hairline bg-white px-3 py-2"
      >
        <span className="flex h-6 w-6 items-center justify-center text-ink-faint">
          {React.cloneElement(icon as React.ReactElement, {
            className: 'h-4 w-4',
            strokeWidth: 1.75,
          })}
        </span>
        <span className="text-[11px] font-medium text-ink-muted">{label}</span>
      </motion.div>
    </motion.div>
  )
}

function CostStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" strokeWidth={1.75} />
      <div>
        <p className="mf-display text-[20px] text-navy">{value}</p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-ink-muted">{label}</p>
      </div>
    </div>
  )
}
