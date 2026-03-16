'use client';

import React from 'react';
import Link from 'next/link';
import { AppButton } from '@/components/ui-system';
import { ArrowRight, ShoppingBag, CreditCard, Package, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function CommerceSection() {
  return (
    <section className="relative overflow-hidden bg-[#18375D] py-24 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(1200px_500px_at_75%_20%,rgba(96,165,250,0.18),transparent_60%)]" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-100">
              <ShoppingBag className="w-3 h-3" /> Medoflow Commerce
            </div>

            <h2 className="mb-5 font-display text-3xl font-bold leading-[1.08] md:text-5xl">
              Care does not stop at checkout.
              <br />
              <span className="text-blue-300">Revenue starts there.</span>
            </h2>

            <p className="mb-7 max-w-lg text-sm leading-relaxed text-blue-100/80 md:text-base">
              Launch a clinic-branded commerce flow with secure payments,
              automated fulfillment, and clear order tracking your team and
              patients can trust.
            </p>

            <div className="mb-8 flex flex-wrap gap-2">
              {['Branded Storefront', 'Auto Fulfillment', 'Tap-to-Pay Ready'].map(
                (pill) => (
                  <span
                    key={pill}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-100/85"
                  >
                    {pill}
                  </span>
                )
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <AppButton
                size="lg"
                className="h-11 rounded-full bg-white px-6 text-sm font-semibold text-[#18375D] hover:bg-slate-100"
                asChild
              >
                <Link href="/register">
                  Enable Commerce <ArrowRight className="ml-2 w-3.5 h-3.5" />
                </Link>
              </AppButton>
              <AppButton
                variant="outline"
                size="lg"
                className="h-11 rounded-full border-white/20 bg-transparent px-6 text-sm font-semibold text-white hover:bg-white/10"
                asChild
              >
                <Link href="#catalog">
                  See Catalog
                </Link>
              </AppButton>
            </div>
          </div>

          <div className="w-full max-w-xl justify-self-end">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl border border-white/10 bg-[#1F3D62]/85 p-5 shadow-[0_24px_70px_rgba(8,20,40,0.38)] backdrop-blur"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <CreditCard className="h-5 w-5 text-blue-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Quick Checkout</h3>
                    <p className="text-xs text-blue-100/65">Tap to pay enabled</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Live
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: 'Vitamin D3 + K2', price: '$34.99', status: 'Fulfilled' },
                  { name: 'Omega-3 Fish Oil', price: '$29.99', status: 'Shipped' },
                  { name: 'Probiotic Complex', price: '$44.99', status: 'Processing' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                        <Package className="h-4 w-4 text-blue-100/80" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.name}</p>
                        <p className="text-[10px] font-semibold text-emerald-300">
                          {item.status}
                        </p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-blue-300">{item.price}</p>
                  </div>
                ))}
              </div>

              <div className="my-5 border-t border-white/10" />

              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm text-blue-100/70">Subtotal</p>
                <p className="text-3xl font-black text-white">$109.97</p>
              </div>

              <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-3">
                {[
                  { value: '$87', label: 'Avg. Order' },
                  { value: '$12.4k', label: 'Monthly' },
                  { value: '42%', label: 'Margin' },
                ].map((metric) => (
                  <div key={metric.label} className="rounded-xl bg-white/[0.04] p-2.5 text-center">
                    <p className="text-2xl font-black text-blue-300">{metric.value}</p>
                    <p className="text-[11px] font-medium text-blue-100/70">{metric.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#3B82F6] px-4 py-3.5">
                <div className="inline-flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  Charge Card
                </div>
                <ArrowRight className="h-4 w-4" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
