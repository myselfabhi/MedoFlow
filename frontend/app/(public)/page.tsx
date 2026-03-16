'use client';

import React from 'react';
import { HeroSection } from '@/components/landing/HeroSection';
import { TrustBanner } from '@/components/landing/TrustBanner';
import { BentoGridSection } from '@/components/landing/BentoGridSection';
import { ChaosToClaritySection } from '@/components/landing/ChaosToClaritySection';
import { DayInTheLifeSection } from '@/components/landing/DayInTheLifeSection';
import { CommerceSection } from '@/components/landing/CommerceSection';
import { ROICalculatorSection } from '@/components/landing/ROICalculatorSection';
import { FinalCTASection } from '@/components/landing/FinalCTASection';

export default function PublicHomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <TrustBanner />
      <BentoGridSection />
      <ChaosToClaritySection />
      <DayInTheLifeSection />
      <CommerceSection />
      <ROICalculatorSection />
      <FinalCTASection />
    </div>
  );
}
