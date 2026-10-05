'use client'

/**
 * MetricsBar (TrustBanner).
 *
 * Modern reveal: animated counters that count up when scrolled into view,
 * floating glass tiles with subtle 3D tilt on hover, and a depth-aware
 * specialty marquee where items closer to viewer appear larger.
 */

import React, { useEffect, useRef, useState } from 'react'
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion'

type Metric = { value: number; suffix: string; prefix?: string; label: string }

const metrics: Metric[] = [
  { value: 2400, suffix: '+', label: 'Clinics across 14 specialties' },
  { value: 18, suffix: ' hrs', label: 'Admin time saved per provider / week' },
  { value: 99.98, suffix: '%', label: 'Uptime across charting + payments' },
]

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
  'Physiotherapy',
  'Chiropractic',
]

function AnimatedCounter({ to, suffix, prefix }: { to: number; suffix: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    let raf = 0
    const start = performance.now()
    const duration = 1800
    const isFloat = !Number.isInteger(to)
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3)
      const v = to * eased
      setDisplay(isFloat ? Number(v.toFixed(2)) : Math.round(v))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to])

  return (
    <span ref={ref}>
      {prefix}
      {Number.isInteger(to) ? display.toLocaleString() : display.toFixed(2)}
      {suffix}
    </span>
  )
}

function MetricTile({ metric, delay }: { metric: Metric; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 200, damping: 18, mass: 0.4 })
  const sry = useSpring(ry, { stiffness: 200, damping: 18, mass: 0.4 })

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    ry.set(((e.clientX - cx) / rect.width) * 14)
    rx.set(-((e.clientY - cy) / rect.height) * 14)
  }

  function handleLeave() {
    rx.set(0)
    ry.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d', perspective: 1000 }}
      className="group relative overflow-hidden rounded-2xl border border-hairline bg-white p-7 shadow-card transition-shadow hover:shadow-card-hover"
    >
      {/* Soft gradient sheen on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at top right, rgba(13, 148, 136, 0.08), transparent 70%)',
        }}
        aria-hidden
      />
      <p className="mf-display text-[clamp(34px,4.5vw,52px)] leading-none text-navy">
        <AnimatedCounter to={metric.value} suffix={metric.suffix} prefix={metric.prefix} />
      </p>
      <p className="mt-3 max-w-[18rem] text-[13px] leading-relaxed text-ink-muted">
        {metric.label}
      </p>
      {/* Bottom accent line — animates in on hover */}
      <div
        className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-teal to-[#5EEAD4] transition-all duration-500 group-hover:w-full"
        aria-hidden
      />
    </motion.div>
  )
}

export function TrustBanner() {
  const doubled = [...specialties, ...specialties]

  return (
    <section className="relative bg-canvas border-y border-hairline overflow-hidden">
      {/* Top accent line — bleeds teal from hero */}
      <div
        className="absolute left-0 right-0 top-0 h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(13, 148, 136, 0.4), transparent)',
        }}
        aria-hidden
      />

      <div className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <p className="mf-eyebrow text-ink-muted">Trusted by clinics nationwide</p>
        </motion.div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
          {metrics.map((m, i) => (
            <MetricTile key={m.label} metric={m} delay={i * 0.08} />
          ))}
        </div>
      </div>

      {/* Depth marquee — items farther in z appear smaller + more faded */}
      <div className="relative border-t border-hairline py-7">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32"
          style={{ background: 'linear-gradient(to right, #FAFAFA, transparent)' }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32"
          style={{ background: 'linear-gradient(to left, #FAFAFA, transparent)' }}
          aria-hidden
        />
        <div className="flex animate-marquee">
          {doubled.map((name, i) => (
            <span
              key={i}
              className="mx-7 flex flex-shrink-0 items-center gap-2.5 whitespace-nowrap text-[13px] font-medium text-ink-muted"
              style={{
                opacity: 0.55 + Math.abs(Math.sin(i * 0.7)) * 0.45,
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-teal/40" aria-hidden />
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
