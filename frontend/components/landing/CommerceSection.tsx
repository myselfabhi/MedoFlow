'use client'

/**
 * CommerceSection — chapter 6 of the narrative.
 *
 * Role: zoom into a single capability that also unlocks revenue. Tone pivot:
 * this is the money section. Layout: left copy + a bold headline stat band;
 * right is a live checkout surface floating in a white-sub-zone on navy.
 */

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Package, ShoppingBag, TrendingUp } from 'lucide-react'
import { Stat, fadeUpInView } from './primitives'
import { useAuthModal } from '@/components/auth/AuthModal'

type OrderLine = {
  name: string
  price: string
  status: string
  tone: 'ok' | 'warn' | 'err'
}

const orderLines: OrderLine[] = [
  { name: 'Vitamin D3 + K2', price: '$34.99', status: 'Fulfilled', tone: 'ok' },
  { name: 'Omega-3 Fish Oil', price: '$29.99', status: 'Shipped', tone: 'ok' },
  { name: 'Probiotic Complex', price: '$44.99', status: 'Processing', tone: 'warn' },
]

export function CommerceSection() {
  const { openSignup } = useAuthModal()
  return (
    <section className="mf-zone-white relative py-28 md:py-36">
      <div className="container mx-auto px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1fr_1.05fr]">
          {/* ─── Left: copy + revenue story ──────────────────────── */}
          <div className="max-w-xl">
            <motion.p {...fadeUpInView(0)} className="mf-eyebrow flex items-center gap-2">
              <ShoppingBag className="h-3 w-3" strokeWidth={2} />
              Chapter 06 &middot; Commerce
            </motion.p>

            <motion.h2
              {...fadeUpInView(0.05)}
              className="mf-display mt-4 text-[36px] text-navy md:text-[52px]"
            >
              Care doesn&rsquo;t stop at checkout.{' '}
              <span className="text-teal">Revenue starts there.</span>
            </motion.h2>

            <motion.p
              {...fadeUpInView(0.1)}
              className="mt-5 max-w-lg text-[16px] leading-relaxed text-ink-muted md:text-[17px]"
            >
              Every recommendation a provider makes &mdash; a supplement, a follow-up bundle, a
              home-care kit &mdash; becomes a one-tap purchase. Stocked, tracked, fulfilled, and
              reconciled without anyone leaving the chart.
            </motion.p>

            <motion.dl
              {...fadeUpInView(0.18)}
              className="mt-10 grid grid-cols-3 gap-6 border-y border-hairline py-8"
            >
              <Stat value="$18.4K" label="Avg. monthly recurring" />
              <Stat value="42%" label="Blended margin" />
              <Stat value="3.2×" label="Revenue per visit" />
            </motion.dl>

            <motion.div {...fadeUpInView(0.26)} className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openSignup}
                className="mf-btn mf-btn-lg mf-btn-primary"
              >
                Enable commerce
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link href="#catalog" className="mf-btn mf-btn-lg mf-btn-outline">
                See catalog
              </Link>
            </motion.div>
          </div>

          {/* ─── Right: live checkout ─────────────────────────────── */}
          <motion.div
            {...fadeUpInView(0.15)}
            className="w-full max-w-md justify-self-center lg:justify-self-end"
          >
            <div className="relative">
              {/* navy backing tile, hints at the app shell */}
              <div
                className="absolute -inset-6 -z-10 rounded-[24px] bg-navy opacity-[0.04]"
                aria-hidden
              />

              <div className="mf-card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mf-eyebrow text-ink-muted">Order &middot; #4029</p>
                    <h3 className="mf-display mt-1 text-[20px] text-ink">Quick checkout</h3>
                  </div>
                  <span className="flex items-center gap-1.5 text-[11px] text-teal">
                    <span className="mf-dot mf-dot--ok" />
                    Live
                  </span>
                </div>

                <div className="mt-5 space-y-2">
                  {orderLines.map((item) => (
                    <div
                      key={item.name}
                      className="mf-card flex items-center justify-between px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="mf-stat-chip">
                          <Package className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </span>
                        <div>
                          <p className="text-[13px] font-medium text-ink">{item.name}</p>
                          <p className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] text-ink-muted">
                            <span className={`mf-dot mf-dot--${item.tone}`} />
                            {item.status}
                          </p>
                        </div>
                      </div>
                      <p className="text-[14px] font-medium text-ink">{item.price}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-hairline pt-4">
                  <p className="text-[13px] text-ink-muted">Subtotal</p>
                  <p className="mf-display text-[24px] text-navy">$109.97</p>
                </div>

                <button className="mf-btn mf-btn-primary mt-4 w-full">
                  Charge card
                  <ArrowRight className="h-4 w-4" />
                </button>

                <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-ink-muted">
                  <TrendingUp className="h-3 w-3" strokeWidth={1.75} />
                  Auto-reconciles with tonight&rsquo;s payout
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
