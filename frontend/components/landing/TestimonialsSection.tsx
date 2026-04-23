'use client'

/**
 * TestimonialsSection — chapter 8 of the narrative.
 *
 * Role: land the emotional proof that real providers already trust this.
 * Layout: asymmetric three-column masonry. No glossy portraits; the quotes
 * carry the weight, not the headshots.
 */

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'
import { SectionHeader, fadeUpInView } from './primitives'

type Testimonial = {
  quote: string
  name: string
  role: string
  clinic: string
  avatar: string
  accent?: boolean
}

const testimonials: Testimonial[] = [
  {
    quote:
      'We closed our EMR, our booking app, and our POS. Medoflow became the whole stack. Front desk went from panicked to bored.',
    name: 'Dr. Priya Mehta',
    role: 'Family medicine',
    clinic: 'Mehta Clinic, Pune',
    avatar: '/doctors/doctor-female-1.jpg',
    accent: true,
  },
  {
    quote: 'The scribe saves me 90 minutes a day. That\u2019s dinner with my kids back.',
    name: 'Dr. James Rodriguez',
    role: 'Internal medicine',
    clinic: 'Valley Primary',
    avatar: '/doctors/doctor-male-1.jpg',
  },
  {
    quote:
      'Our supplement revenue doubled the month we turned commerce on. The provider never even had to plug a card reader in.',
    name: 'Anya Kapoor',
    role: 'Practice manager',
    clinic: 'Glow Dermatology',
    avatar: '/doctors/doctor-female-2.jpg',
  },
  {
    quote:
      'Onboarding took us a Tuesday. That\u2019s it. By Wednesday morning we were live with 400 patient records imported.',
    name: 'Dr. Michael Chen',
    role: 'Integrative medicine',
    clinic: 'Harmony Health',
    avatar: '/doctors/doctor-male-2.jpg',
  },
  {
    quote:
      'No-shows dropped 34%. I\u2019m not even sure which reminder did it &mdash; probably all of them.',
    name: 'Dr. Sarah Mitchell',
    role: 'Pediatrician',
    clinic: 'Cedar Pediatrics',
    avatar: '/doctors/doctor-female-1.jpg',
  },
  {
    quote: 'I haven\u2019t finished a chart after 6pm in three months.',
    name: 'Dr. Emily Watson',
    role: 'Psychiatrist',
    clinic: 'Mindpath',
    avatar: '/doctors/doctor-female-2.jpg',
  },
]

export function TestimonialsSection() {
  return (
    <section className="mf-zone-white relative py-28 md:py-36 border-t border-hairline">
      <div className="container mx-auto px-6">
        <SectionHeader
          eyebrow="Loved by providers"
          title={
            <>
              Doctors who stopped <br className="hidden md:block" />
              staying late.
            </>
          }
          description="A handful of the 2,400+ clinics now running on Medoflow."
        />

        {/* Masonry via column-count — reads as naturally staggered */}
        <div className="mx-auto mt-20 max-w-6xl columns-1 gap-5 md:columns-2 lg:columns-3 [column-fill:_balance]">
          {testimonials.map((t, i) => (
            <Card key={t.name} t={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function Card({ t, index }: { t: Testimonial; index: number }) {
  return (
    <motion.figure
      {...fadeUpInView(index * 0.05)}
      className={`mb-5 break-inside-avoid rounded-[12px] border p-6 ${
        t.accent ? 'border-teal bg-teal-wash' : 'border-hairline bg-white'
      }`}
    >
      <Quote
        className={`mb-4 h-5 w-5 ${t.accent ? 'text-teal' : 'text-ink-faint'}`}
        strokeWidth={1.5}
      />
      <blockquote
        className={`mf-display text-[17px] leading-snug md:text-[18px] ${
          t.accent ? 'text-navy' : 'text-ink'
        }`}
        // Quote strings include one &mdash;; render safely.
        dangerouslySetInnerHTML={{ __html: `&ldquo;${t.quote}&rdquo;` }}
      />
      <figcaption className="mt-6 flex items-center gap-3">
        <div className="relative h-9 w-9 overflow-hidden rounded-full border border-hairline">
          <Image src={t.avatar} alt="" fill sizes="36px" className="object-cover" />
        </div>
        <div>
          <p className="text-[13px] font-medium text-ink">{t.name}</p>
          <p className="text-[11.5px] text-ink-muted">
            {t.role} &middot; {t.clinic}
          </p>
        </div>
      </figcaption>
    </motion.figure>
  )
}
