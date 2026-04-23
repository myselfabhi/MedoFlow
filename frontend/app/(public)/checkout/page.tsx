'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { StripePaymentForm } from '@/components/StripePaymentForm'
import { useCart } from '@/hooks/useCart'
import { LogIn } from 'lucide-react'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
)

export default function CheckoutPage() {
  const { cart, isLoading, isAuthenticated } = useCart()
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const router = useRouter()

  const handleInitiateCheckout = async () => {
    if (!isAuthenticated) {
      router.push('/?auth=login&returnUrl=/checkout')
      return
    }
    try {
      const res = await api.post('/carts/checkout')
      setClientSecret(res.data.data.clientSecret)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initiate checkout')
    }
  }

  const handleDemoPayment = async () => {
    if (isDemoSubmitting) return
    if (!isAuthenticated) {
      router.push('/?auth=login&returnUrl=/checkout')
      return
    }
    try {
      setIsDemoSubmitting(true)
      await api.post('/carts/checkout-demo')
      toast.success('Demo Payment successful!')
      router.push('/?view=billing')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Demo Payment failed')
    } finally {
      setIsDemoSubmitting(false)
    }
  }

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
        <p className="text-slate-500 font-medium">Loading your items...</p>
      </div>
    )

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto py-24 text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
          <LogIn className="h-10 w-10 text-slate-300" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Your cart is empty</h1>
        <p className="text-slate-500">Looks like you haven't added anything to your cart yet.</p>
        <Button onClick={() => router.push('/store')} className="rounded-full px-8">
          Go to Store
        </Button>
      </div>
    )
  }

  const subtotal = cart.items.reduce(
    (sum: number, item: any) => sum + Number(item.unitPrice) * item.quantity,
    0
  )

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-12 lg:px-0">
      <div className="mb-8 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-center md:justify-between">
        <h1 className="text-[28px] font-black tracking-tight text-slate-900 sm:text-4xl">
          Review Order
        </h1>
        {!isAuthenticated && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
            <LogIn className="h-4 w-4" /> Guest Session
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b-0 py-6 px-8">
              <CardTitle className="text-xl font-bold text-slate-900">Items in Cart</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {cart.items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-5 transition-colors hover:bg-slate-50/50 sm:p-8"
                  >
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0">
                        {item.itemType === 'PRODUCT' ? (
                          <ShoppingBag className="h-8 w-8 text-slate-300" />
                        ) : (
                          <Package className="h-8 w-8 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-lg">
                          {item.itemType === 'PRODUCT'
                            ? item.product?.name
                            : item.itemType === 'PACKAGE'
                              ? item.package?.name
                              : item.itemType === 'MEMBERSHIP'
                                ? item.membership?.name
                                : item.itemType === 'SERVICE'
                                  ? item.service?.name
                                  : item.name || 'Item'}
                        </div>
                        <div className="text-sm text-slate-500 font-medium">
                          Quantity: {item.quantity} × ${Number(item.unitPrice).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="font-black text-slate-900 text-xl">
                      ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-primary text-white">
            <CardHeader className="p-8 border-none pb-0">
              <CardTitle className="text-white/60 text-sm font-black uppercase tracking-widest">
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="flex justify-between items-baseline">
                <span className="text-white/70 font-medium">Subtotal</span>
                <span className="text-2xl font-bold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-baseline border-t border-white/10 pt-4">
                <span className="text-lg font-bold">Total Due</span>
                <span className="text-4xl font-black text-white">${subtotal.toFixed(2)}</span>
              </div>

              {!isAuthenticated ? (
                <div className="space-y-4 pt-4">
                  <p className="text-xs text-center text-white/60 leading-relaxed font-medium">
                    You are currently a guest. Please sign in to securely finalize your purchase and
                    sync order to your account.
                  </p>
                  <Button
                    className="w-full h-14 text-lg rounded-2xl bg-white text-primary hover:bg-white/90 font-bold shadow-2xl shadow-black/20"
                    onClick={() => router.push('/?auth=login&returnUrl=/checkout')}
                  >
                    Login to Checkout
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  {!clientSecret ? (
                    <div className="space-y-4">
                      <Button
                        className="w-full h-14 text-lg rounded-2xl bg-white text-primary hover:bg-white/90 font-bold shadow-2xl shadow-black/20"
                        onClick={handleInitiateCheckout}
                      >
                        Secure Checkout
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full text-white/60 hover:text-white hover:bg-white/5 font-bold"
                        onClick={handleDemoPayment}
                        disabled={isDemoSubmitting}
                      >
                        {isDemoSubmitting ? 'Processing...' : 'Simulate Demo Payment'}
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-6 text-slate-900">
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <StripePaymentForm
                          clientSecret={clientSecret}
                          buttonLabel={`Pay $${subtotal.toFixed(2)}`}
                          onSuccess={() => router.push('/?view=appointments')}
                        />
                      </Elements>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex items-start gap-4">
            <ShieldCheck className="h-6 w-6 text-primary-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-900">Secure Payment</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your transaction is encrypted and HIPAA compliant.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Add these icons to the imports if missing
import { ShoppingBag, Package, ShieldCheck } from 'lucide-react'
