'use client';

import React from 'react';
import Link from 'next/link';
import { AppButton } from '@/components/ui-system';
import { ArrowRight, ShoppingBag, CreditCard, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollReveal } from './ScrollReveal';
import { AnimatedCounter } from './AnimatedCounter';

export function CommerceSection() {
  return (
    <section className="py-28 overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0 ai-gradient-bg" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.08)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.05)_0%,transparent_40%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 max-w-6xl mx-auto">

          {/* Left */}
          <ScrollReveal direction="left" className="flex-1 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-[10px] font-semibold mb-6 border border-white/10 uppercase tracking-widest backdrop-blur-sm">
              <ShoppingBag className="w-3 h-3" /> Medoflow Commerce
            </div>

            <h2 className="text-4xl md:text-5xl font-bold font-display leading-[1.08] mb-5 text-white tracking-tight">
              Don&apos;t just provide care.
              <br />
              <span className="text-accent-300">Transact.</span>
            </h2>

            <p className="text-base text-white/70 leading-relaxed mb-8">
              Launch your clinic&apos;s branded store. Sell supplements from verified suppliers with orders fulfilled automatically. New revenue, zero friction.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <AppButton size="lg" className="rounded-full bg-white text-slate-900 hover:bg-white/90 px-7 h-11 text-sm font-semibold shadow-lg" asChild>
                <Link href="/register">
                  Enable Commerce <ArrowRight className="ml-2 w-3.5 h-3.5" />
                </Link>
              </AppButton>
              <AppButton variant="outline" size="lg" className="rounded-full border-white/20 text-white hover:bg-white/10 px-7 h-11 text-sm font-semibold bg-transparent" asChild>
                <Link href="#catalog">
                  See Catalog
                </Link>
              </AppButton>
            </div>
          </ScrollReveal>

          {/* Right: Mockup */}
          <ScrollReveal direction="right" className="flex-1 w-full max-w-lg">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="bg-white/[0.08] backdrop-blur-sm rounded-3xl p-6 border border-white/10 shadow-2xl relative"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-accent-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Quick Checkout</h3>
                  <p className="text-xs text-white/50">Tap to pay enabled</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  { name: 'Vitamin D3 + K2', price: '$34.99', status: 'Fulfilled', statusColor: 'text-emerald-400' },
                  { name: 'Omega-3 Fish Oil', price: '$29.99', status: 'Shipped', statusColor: 'text-emerald-400' },
                  { name: 'Probiotic Complex', price: '$44.99', status: 'Processing', statusColor: 'text-amber-400' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        <Package className="w-4 h-4 text-white/60" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{item.name}</p>
                        <p className={`text-[10px] font-medium ${item.statusColor}`}>{item.status}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-accent-300">{item.price}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between py-4 border-t border-white/10 mb-6">
                <span className="text-white/50 text-sm">Subtotal</span>
                <span className="text-xl font-bold text-white">$109.97</span>
              </div>

              <div className="w-full py-4 rounded-xl bg-accent text-white text-center font-bold shadow-lg shadow-accent/20 hover:bg-accent-500 transition-colors cursor-pointer">
                Charge Card
              </div>
            </motion.div>

            {/* Metric cards */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { value: 87, prefix: '$', label: 'Avg. Order' },
                { value: 12, suffix: 'k', prefix: '$', label: 'Monthly' },
                { value: 42, suffix: '%', label: 'Margin' },
              ].map((m, i) => (
                <div key={i} className="bg-white/[0.08] backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                  <p className="text-2xl font-bold text-white font-display mb-1">
                    <AnimatedCounter target={m.value} prefix={m.prefix} suffix={m.suffix} />
                  </p>
                  <p className="text-xs text-white/50 font-medium">{m.label}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
