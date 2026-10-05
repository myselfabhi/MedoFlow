'use client'

/**
 * TestimonialsSection — social proof, made human.
 *
 * Big featured quote up top with a real provider's face. Three smaller
 * testimonial tiles below from different specialties. Hover-tilt for
 * a tactile feel.
 */

import React, { useRef } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { Quote, Star } from 'lucide-react'
import { SectionHeader } from './primitives'

type Testimonial = {
  quote: string
  who: string
  role: string
  clinic: string
  location: string
  avatar: string
  metric?: { value: string; label: string }
}

const featured: Testimonial = {
  quote:
    'I came from Jane. I came from SimplePractice. I came from a $400/mo stack of tools I never fully understood. MedoFlow is the first one I open every morning without dreading it.',
  who: 'Dr. Sarah Chen',
  role: 'Founder & Physiotherapist',
  clinic: 'Atlas Physiotherapy',
  location: 'Austin, TX',
  avatar: '/doctors/doctor-female-1.jpg',
  metric: { value: '22 hrs', label: 'saved per week' },
}

const others: Testimonial[] = [
  {
    quote:
      'My patients book appointments at 11 PM from their phone. They show up. They pay before they leave. The whole flow just works.',
    who: 'Dr. Marcus Yeung',
    role: 'Naturopath',
    clinic: 'Pine Wellness',
    location: 'Seattle, WA',
    avatar: '/doctors/doctor-male-1.jpg',
  },
  {
    quote:
      'The AI scribe gave me my evenings back. I sign 12 charts during the day now — not at 9 PM with a glass of wine and a sigh.',
    who: 'Dr. Priya Nair',
    role: 'Family Medicine',
    clinic: 'Lotus Family Med',
    location: 'Phoenix, AZ',
    avatar: '/doctors/doctor-female-2.jpg',
  },
  {
    quote:
      "Our front desk hires a new admin in week one — and they're productive by lunch. The interface just makes sense.",
    who: 'Elena Vasquez',
    role: 'Practice Manager',
    clinic: 'BrightPath Mental Health',
    location: 'Denver, CO',
    avatar: '/doctors/doctor-female-1.jpg',
  },
]

function TiltCard({ children }: { children: React.ReactNode }) {
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
    ry.set(((e.clientX - cx) / rect.width) * 10)
    rx.set(-((e.clientY - cy) / rect.height) * 10)
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
      style={{ rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d', perspective: 1000 }}
      className="h-full"
    >
      {children}
    </motion.div>
  )
}

function FeaturedCard({ t }: { t: Testimonial }) {
  return (
    <TiltCard>
      <div className="relative h-full overflow-hidden rounded-3xl bg-navy p-10 text-white md:p-14">
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full opacity-50"
          style={{
            background: 'radial-gradient(circle, rgba(94,234,212,0.4), transparent 70%)',
          }}
          aria-hidden
        />
        <div className="relative grid grid-cols-1 items-center gap-10 md:grid-cols-[1fr_auto]">
          <div>
            <Quote className="h-7 w-7 text-teal-bright/50" strokeWidth={1.5} />
            <p className="mf-display mt-5 text-[clamp(22px,2.8vw,32px)] leading-[1.3] text-white">
              "{t.quote}"
            </p>

            <div className="mt-8 flex items-center gap-4">
              <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-teal-bright/50">
                <Image src={t.avatar} alt={t.who} fill sizes="48px" className="object-cover" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-white">{t.who}</p>
                <p className="text-[12px] text-white/60">
                  {t.role} · {t.clinic} · {t.location}
                </p>
              </div>
            </div>
          </div>

          {t.metric && (
            <div className="hidden flex-shrink-0 rounded-2xl border border-teal-bright/30 bg-white/[0.04] p-7 text-center backdrop-blur-sm md:block">
              <p className="mf-display text-[clamp(36px,5vw,52px)] leading-none text-teal-bright">
                {t.metric.value}
              </p>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-white/60">
                {t.metric.label}
              </p>
            </div>
          )}
        </div>
      </div>
    </TiltCard>
  )
}

function MiniCard({ t, delay }: { t: Testimonial; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.6, delay }}
      className="h-full"
    >
      <TiltCard>
        <div className="relative flex h-full flex-col rounded-2xl border border-hairline bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover">
          <div className="flex items-center gap-1 text-teal">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
            ))}
          </div>
          <p className="mt-4 flex-1 text-[14px] leading-relaxed text-ink">"{t.quote}"</p>
          <div className="mt-6 flex items-center gap-3 border-t border-hairline pt-4">
            <div className="relative h-9 w-9 overflow-hidden rounded-full ring-1 ring-hairline">
              <Image src={t.avatar} alt={t.who} fill sizes="36px" className="object-cover" />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-ink">{t.who}</p>
              <p className="text-[11px] text-ink-muted">
                {t.clinic} · {t.location}
              </p>
            </div>
          </div>
        </div>
      </TiltCard>
    </motion.div>
  )
}

export function TestimonialsSection() {
  return (
    <section className="mf-zone-white relative py-28 md:py-36">
      <div className="container mx-auto px-6">
        <SectionHeader
          eyebrow="The clinics already on MedoFlow"
          title={
            <>
              Real owners. Real numbers. <span className="text-ink-muted">Real evenings off.</span>
            </>
          }
          description="2,400+ clinics across 14 specialties — from solo therapists to 20-provider multi-location groups."
        />

        <div className="mx-auto mt-16 max-w-6xl">
          <FeaturedCard t={featured} />

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
            {others.map((t, i) => (
              <MiniCard key={t.who} t={t} delay={i * 0.08} />
            ))}
          </div>
        </div>

        {/* Trust strip — clinic name marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-20 max-w-5xl text-center"
        >
          <p className="mf-eyebrow text-ink-muted">Also running on MedoFlow</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[14px] font-medium text-ink-muted">
            {[
              'Cedar Health',
              'Northstar PT',
              'Bloom Pediatrics',
              'Coastal Dermatology',
              'Vertex Chiropractic',
              'Quiet Mind Therapy',
              'Origin Wellness',
              'Apex Sports Med',
            ].map((name) => (
              <span key={name} className="hover:text-ink transition-colors">
                {name}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
