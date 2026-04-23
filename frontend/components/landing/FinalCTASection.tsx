'use client'

/**
 * FinalCTA — chapter 9, the close.
 *
 * Role: ask for the decision. Tone: confident, not pleading.
 * Layout: full-bleed navy, oversized display type, a teal glow behind it,
 * and two CTAs. Fine print sits as reassurance, not as a warning.
 */

import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { StatusChip } from './primitives'
import { useAuthModal } from '@/components/auth/AuthModal'

export function FinalCTASection() {
  const { openSignup } = useAuthModal()
  return (
    <section className="mf-zone-navy relative overflow-hidden">
      <div className="absolute inset-0 mf-grid-pattern opacity-50" aria-hidden />
      <div
        className="absolute -bottom-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-[180px]"
        style={{ backgroundColor: 'rgba(13, 148, 136, 0.35)' }}
        aria-hidden
      />

      <div className="container relative z-10 mx-auto px-6 py-28 text-center md:py-40">
        <p className="mf-eyebrow mb-5">Ready when you are</p>
        <h2 className="mf-display mx-auto max-w-4xl text-[44px] text-white md:text-[72px]">
          Run your entire practice <br className="hidden md:block" />
          on a <span className="text-teal-bright">single timeline.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-white/70">
          Join 2,400+ clinics already running intake, charting, and billing on Medoflow.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={openSignup} className="mf-btn mf-btn-lg mf-btn-primary">
            Start free trial
            <ArrowRight className="h-4 w-4" />
          </button>
          <Link href="#demo" className="mf-btn mf-btn-lg mf-btn-ghost">
            Book a demo
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <StatusChip onNavy>14-day trial</StatusChip>
          <StatusChip onNavy>No credit card</StatusChip>
          <StatusChip onNavy>HIPAA &amp; SOC2 aligned</StatusChip>
        </div>
      </div>
    </section>
  )
}
