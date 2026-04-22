'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AppButton } from '@/components/ui-system';
import {
  LifeBuoy,
  ChevronDown,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FAQS = [
  {
    q: 'How do I book an appointment?',
    a: 'Head to the Store from the navigation bar, pick a service, then choose the time slot that fits.',
  },
  {
    q: 'Can I reschedule or cancel a visit?',
    a: 'Open My Appointments, select the visit, and use Reschedule or Cancel. Cancellation fees may apply within 24 hours.',
  },
  {
    q: 'Where do I find my invoices?',
    a: 'Billing & Invoices in your profile menu lists every receipt. Paid visits show a PAID badge.',
  },
  {
    q: 'Is my health data secure?',
    a: 'Yes. All data is encrypted and stored in HIPAA-compliant infrastructure.',
  },
];

export function HelpModal({ open, onOpenChange }: Props) {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-3xl border-slate-100 bg-white p-0 overflow-hidden max-h-[85vh] flex flex-col">
        <div className="relative bg-gradient-to-br from-accent via-accent-700 to-primary-700 p-6 text-white">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <LifeBuoy className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">Help & Support</DialogTitle>
                <DialogDescription className="text-sm text-white/75">
                  We're here whenever you need us
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Quick contact */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <a
              href="mailto:support@medoflow.com"
              className="group flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white p-3 transition-all hover:border-primary/30 hover:shadow-card"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-500">Email</p>
                <p className="truncate text-xs font-semibold text-slate-900">support@medoflow.com</p>
              </div>
            </a>
            <a
              href="tel:+18005551234"
              className="group flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white p-3 transition-all hover:border-accent/30 hover:shadow-card"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent-700">
                <Phone className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-500">Phone</p>
                <p className="truncate text-xs font-semibold text-slate-900">1-800-555-1234</p>
              </div>
            </a>
            <button
              className="group flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white p-3 transition-all hover:border-primary/30 hover:shadow-card"
              onClick={() => alert('Live chat coming soon')}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-bold text-slate-500">Live chat</p>
                <p className="truncate text-xs font-semibold text-slate-900">Mon–Fri, 9–6</p>
              </div>
            </button>
          </div>

          {/* FAQs */}
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
              Frequently asked
            </h3>
            <div className="space-y-2">
              {FAQS.map((faq, i) => {
                const isOpen = expanded === i;
                return (
                  <div
                    key={i}
                    className="overflow-hidden rounded-2xl border border-slate-100 bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : i)}
                      className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-slate-50"
                    >
                      <p className="text-sm font-semibold text-slate-900">{faq.q}</p>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 shrink-0 text-slate-400 transition-transform',
                          isOpen && 'rotate-180 text-primary'
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                        <p className="text-sm text-slate-600">{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Help Center link */}
          <a
            href="#"
            className="flex items-center justify-between rounded-2xl border border-primary-100 bg-primary-50/40 p-4 transition-all hover:border-primary/30"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">Visit our Help Center</p>
              <p className="text-xs text-slate-500">Guides, articles, and video tutorials.</p>
            </div>
            <ExternalLink className="h-4 w-4 text-primary" />
          </a>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/50 p-4">
          <AppButton variant="outline" onClick={() => onOpenChange(false)} className="w-full rounded-full">
            Close
          </AppButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
