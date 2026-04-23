'use client'

/**
 * PublicFooter — anchoring navy edge at the bottom of the marketing shell.
 *
 * Layout: tagline + newsletter on the left, column groups on the right.
 * Navy treatment matches the design system: edges are navy, teal for actions.
 */

import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { BrandLogo } from '@/components/common/BrandLogo'

type FooterColumn = {
  title: string
  links: { href: string; label: string }[]
}

const columns: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { href: '/#features', label: 'Features' },
      { href: '/#how-it-works', label: 'How it works' },
      { href: '/#pricing', label: 'Pricing' },
      { href: '/register', label: 'Start free trial' },
    ],
  },
  {
    title: 'Built for',
    links: [
      { href: '#', label: 'Primary care' },
      { href: '#', label: 'Specialists' },
      { href: '#', label: 'Mental health' },
      { href: '#', label: 'Med spas' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '#', label: 'Documentation' },
      { href: '#', label: 'API reference' },
      { href: '#', label: 'Case studies' },
      { href: '#', label: 'Blog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '#', label: 'About' },
      { href: '#', label: 'Careers' },
      { href: '#', label: 'Contact' },
      { href: '#', label: 'Press' },
    ],
  },
]

export function PublicFooter() {
  return (
    <footer className="mf-zone-navy relative overflow-hidden">
      <div className="absolute inset-0 mf-grid-pattern opacity-30" aria-hidden />
      <div className="container relative z-10 mx-auto px-6 pt-20 pb-10 md:pt-24">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_2fr]">
          {/* Brand + newsletter */}
          <div className="max-w-sm">
            <BrandLogo size="lg" tone="light" />
            <p className="mt-5 text-[14px] leading-relaxed text-white/65">
              The operating system for modern clinics. Intake to paid, on one timeline.
            </p>

            <form
              className="mt-8"
              onSubmit={(e) => {
                e.preventDefault()
                // Wired by the ops team — placeholder submit.
              }}
            >
              <label htmlFor="footer-email" className="mf-eyebrow text-white/55">
                Get product updates
              </label>
              <div className="mt-3 flex overflow-hidden rounded-[10px] border border-white/15 bg-white/[0.06]">
                <input
                  id="footer-email"
                  type="email"
                  required
                  placeholder="you@clinic.com"
                  className="flex-1 bg-transparent px-4 py-2.5 text-[13px] text-white placeholder:text-white/40 focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-white px-4 text-[12.5px] font-medium text-navy transition-colors hover:bg-white/90"
                >
                  Subscribe
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
            {columns.map((c) => (
              <div key={c.title}>
                <h4 className="mf-eyebrow text-white/55">{c.title}</h4>
                <ul className="mt-5 space-y-3">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-[13px] text-white/75 transition-colors hover:text-white"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 md:flex-row md:items-center">
          <p className="text-[12.5px] text-white/50">
            &copy; {new Date().getFullYear()} Medoflow. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-white/55">
            <Link href="#" className="transition-colors hover:text-white">
              Privacy
            </Link>
            <Link href="#" className="transition-colors hover:text-white">
              Terms
            </Link>
            <Link href="#" className="transition-colors hover:text-white">
              HIPAA compliance
            </Link>
            <Link href="#" className="transition-colors hover:text-white">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
