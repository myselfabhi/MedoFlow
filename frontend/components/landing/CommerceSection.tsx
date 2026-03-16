'use client';

import React from 'react';
import Link from 'next/link';
import { AppButton } from '@/components/ui-system';
import { ArrowRight, ShoppingBag, CreditCard, Package } from 'lucide-react';
import { motion } from 'framer-motion';

export function CommerceSection() {
  return (
    <section className="py-24 bg-primary text-white overflow-hidden relative">
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 max-w-5xl mx-auto">
          
          {/* Left: Text Content */}
          <div className="flex-1 max-w-lg">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/10 text-slate-300 text-[10px] font-semibold mb-6 border border-white/5 uppercase tracking-widest">
              <ShoppingBag className="w-3 h-3" /> Medoflow Commerce
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold font-display leading-[1.1] mb-5">
              Don't just provide care.<br />
              <span className="text-accent">Transact.</span>
            </h2>
            
            <p className="text-sm text-slate-300 leading-relaxed mb-8">
              Launch your clinic's branded store. Sell supplements from verified suppliers with orders fulfilled automatically. Your patients get quality products. You get a new revenue stream.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <AppButton size="lg" className="rounded-full bg-accent text-white hover:bg-accent-600 px-6 h-10 text-sm font-medium" asChild>
                <Link href="/register">
                  Enable Commerce <ArrowRight className="ml-2 w-3.5 h-3.5" />
                </Link>
              </AppButton>
              <AppButton variant="outline" size="lg" className="rounded-full border-white/20 text-white hover:bg-white/10 px-6 h-10 text-sm font-medium bg-transparent" asChild>
                <Link href="#catalog">
                  See Catalog
                </Link>
              </AppButton>
            </div>
          </div>

          {/* Right: Mockup */}
          <div className="flex-1 w-full max-w-lg">
            {/* Main Checkout Card */}
            <div className="bg-[#243346] rounded-3xl p-6 border border-white/5 shadow-2xl relative">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Quick Checkout</h3>
                  <p className="text-xs text-slate-400">Tap to pay enabled</p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3 mb-6">
                {[
                  { name: 'Vitamin D3 + K2', price: '$34.99', status: 'Fulfilled', statusColor: 'text-emerald-400' },
                  { name: 'Omega-3 Fish Oil', price: '$29.99', status: 'Shipped', statusColor: 'text-emerald-400' },
                  { name: 'Probiotic Complex', price: '$44.99', status: 'Processing', statusColor: 'text-amber-400' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        <Package className="w-4 h-4 text-slate-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{item.name}</p>
                        <p className={`text-[10px] font-medium ${item.statusColor}`}>✓ {item.status}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-accent">{item.price}</p>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between py-4 border-t border-white/5 mb-6">
                <span className="text-slate-400 text-sm">Subtotal</span>
                <span className="text-xl font-bold text-white">$109.97</span>
              </div>

              {/* Button */}
              <div className="w-full py-4 rounded-xl bg-accent text-white text-center font-bold shadow-lg shadow-accent/20">
                Charge Card
              </div>
            </div>

            {/* Metric Cards Bottom */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-[#243346] rounded-2xl p-4 border border-white/5 text-center">
                <p className="text-2xl font-bold text-accent font-display mb-1">$87</p>
                <p className="text-xs text-slate-400 font-medium">Avg. Order</p>
              </div>
              <div className="bg-[#243346] rounded-2xl p-4 border border-white/5 text-center">
                <p className="text-2xl font-bold text-accent font-display mb-1">$12.4k</p>
                <p className="text-xs text-slate-400 font-medium">Monthly</p>
              </div>
              <div className="bg-[#243346] rounded-2xl p-4 border border-white/5 text-center">
                <p className="text-2xl font-bold text-slate-300 font-display mb-1">42%</p>
                <p className="text-xs text-slate-400 font-medium">Margin</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
