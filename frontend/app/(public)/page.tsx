'use client'

/**
 * Public landing page.
 *
 * Cinematic, scroll-driven story. Each section is a chapter:
 *   1. Hero           — 3D arrival
 *   2. TrustBanner    — credibility marquee
 *   3. ChaosSection   — the problem (tension)
 *   4. BentoGrid      — the four-pillar solution (resolve)
 *   5. DayInTheLife   — what a real day feels like
 *   6. Commerce       — zoom into the revenue angle
 *   7. ROICalculator  — make it personal
 *   8. Testimonials   — social proof
 *   9. FinalCTA       — the close
 */

import React from 'react'
import { HeroSection } from '@/components/landing/HeroSection'
import { TrustBanner } from '@/components/landing/TrustBanner'
import { ChaosToClaritySection } from '@/components/landing/ChaosToClaritySection'
import { BentoGridSection } from '@/components/landing/BentoGridSection'
import { DayInTheLifeSection } from '@/components/landing/DayInTheLifeSection'
import { CommerceSection } from '@/components/landing/CommerceSection'
import { ROICalculatorSection } from '@/components/landing/ROICalculatorSection'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'
import { FinalCTASection } from '@/components/landing/FinalCTASection'
import { SmoothScroll } from '@/components/landing/motion/SmoothScroll'
import { ScrollProgress } from '@/components/landing/motion/ScrollProgress'

export default function PublicHomePage() {
  return (
    <div className="flex flex-col">
      <SmoothScroll />
      <ScrollProgress />
      <HeroSection />
      <TrustBanner />
      <ChaosToClaritySection />
      <BentoGridSection />
      <DayInTheLifeSection />
      <CommerceSection />
      <ROICalculatorSection />
      <TestimonialsSection />
      <FinalCTASection />
    </div>
  )
}
