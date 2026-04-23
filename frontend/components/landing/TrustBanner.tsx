'use client'

/**
 * MetricsBar (formerly TrustBanner).
 *
 * Narrative role: immediate numeric credibility right after the hero.
 * Visual: thin white strip between the navy hero and the white workspace.
 * Three stats + a quiet marquee of specialties underneath.
 */

import React from 'react'
import { motion } from 'framer-motion'
import { fadeUpInView } from './primitives'

const metrics = [
  { value: '2,400+', label: 'Clinics across 14 specialties' },
  { value: '18 hrs', label: 'Admin time saved per provider / week' },
  { value: '99.98%', label: 'Uptime across charting + payments' },
] as const

const specialties = [
  'Primary Care',
  'Dermatology',
  'Mental Health',
  'Orthopedics',
  'Pediatrics',
  'Cardiology',
  'Med Spas',
  'Wellness Clinics',
  'Internal Medicine',
  'Neurology',
] as const

export function TrustBanner() {
  const doubled = [...specialties, ...specialties]

  return (
    <section className="bg-canvas border-y border-hairline">
      {/* Top row — numeric proof */}
      <div className="container mx-auto px-6 py-14">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              {...fadeUpInView(i * 0.06)}
              className="flex flex-col items-center text-center md:items-start md:text-left"
            >
              <p className="mf-display text-[32px] text-navy md:text-[40px]">{m.value}</p>
              <p className="mt-2 max-w-[16rem] text-[13px] leading-relaxed text-ink-muted">
                {m.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom row — whisper-quiet specialty marquee */}
      <div className="relative border-t border-hairline py-6">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32"
          style={{ background: 'linear-gradient(to right, #FAFAFA, transparent)' }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32"
          style={{ background: 'linear-gradient(to left, #FAFAFA, transparent)' }}
        />
        <div className="flex animate-marquee">
          {doubled.map((name, i) => (
            <span
              key={i}
              className="mx-8 flex flex-shrink-0 items-center gap-2 whitespace-nowrap text-[13px] font-medium text-ink-muted"
            >
              <span className="h-1 w-1 rounded-full bg-hairline" aria-hidden />
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
