'use client'

/**
 * ClinicStorefront — clinic-scoped product grid.
 *
 *   variant="preview" — first 4 products + "View full store →" link.
 *                       Mounted inside <ClinicLanding> for logged-in patients.
 *   variant="full"    — every active product. Drives /clinic/[id]/store.
 *
 * Membership gate: if the patient is logged in but belongs to a different
 *   clinic, we show a "Sign in with your {clinic.name} account" notice
 *   instead of the grid. Logged-out users never see this component (the
 *   parent already gates on `showPrivate`).
 *
 * Adding to cart:
 *   • Logged-out → opens the auth modal (parent handles bounce-to-clinic)
 *   • Logged-in patient of THIS clinic → useCart().addToCart, then opens
 *     the cart drawer themed in the clinic color.
 */

import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import { getPublicClinicProducts } from '@/lib/clinicApi'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/hooks/useCart'
import { useCartModal } from '@/components/store/CartModal'
import { useAuthModal } from '@/components/auth/AuthModal'
import { ClinicProductCard } from './ClinicProductCard'

interface Product {
  id: string
  name: string
  description?: string | null
  price: string | number
  inventoryItem?: { quantityInStock: number } | null
}

interface Props {
  /** Resolved clinic CUID — used for the wrong-clinic membership check. */
  clinicId: string
  /** Slug or cuid — used for routing the "View full store" link. */
  routeId: string
  /** Display name for empty / wrong-clinic notices. */
  clinicName: string
  themeColor: string
  variant: 'preview' | 'full'
}

const PREVIEW_LIMIT = 4

export function ClinicStorefront({
  clinicId,
  routeId,
  clinicName,
  themeColor,
  variant,
}: Props) {
  const { user, isAuthenticated } = useAuth()
  const { addToCart } = useCart()
  const cartModal = useCartModal()
  const { openLogin } = useAuthModal()

  // The parent (ClinicLanding) only mounts this when authenticated, so
  // fetching here is safe. The dedicated /store page checks isAuthenticated
  // before mounting too.
  const { data: products, isLoading } = useQuery({
    queryKey: ['clinic-public-products', clinicId],
    queryFn: () => getPublicClinicProducts(clinicId) as Promise<Product[]>,
    enabled: !!clinicId,
  })

  const isPatient = user?.role === 'PATIENT'
  // The user belongs here if their User.clinicId matches. We rely on the
  // backend `requireClinicScope` middleware as the security boundary;
  // this is purely a UX gate so members of other clinics get a clear
  // message instead of a 403 toast.
  const belongsToThisClinic = isPatient && user?.clinicId === clinicId

  // Wrong clinic — show notice instead of products.
  if (isAuthenticated && isPatient && !belongsToThisClinic) {
    return (
      <WrongClinicNotice clinicName={clinicName} themeColor={themeColor} />
    )
  }

  const handleAdd = async (product: Product) => {
    if (!isAuthenticated) {
      openLogin()
      return
    }
    if (!belongsToThisClinic) {
      // Defensive — shouldn't reach here because we render the notice above.
      return
    }
    await addToCart(product, 'PRODUCT', 1)
    cartModal.open({ themeColor, routeId })
  }

  const all = products ?? []
  const list = variant === 'preview' ? all.slice(0, PREVIEW_LIMIT) : all

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            {variant === 'preview' ? 'Featured products' : 'Shop'}
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
            {variant === 'preview' ? 'Curated by your clinic' : `${clinicName} storefront`}
          </h2>
        </div>

        {variant === 'preview' && all.length > PREVIEW_LIMIT && (
          <Link
            href={`/clinic/${routeId}/store`}
            className="inline-flex items-center gap-1.5 text-[13px] font-bold transition-opacity hover:opacity-80"
            style={{ color: themeColor }}
          >
            View full store
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState themeColor={themeColor} />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => (
            <ClinicProductCard
              key={p.id}
              product={p}
              themeColor={themeColor}
              onAdd={handleAdd}
              compact={variant === 'preview'}
            />
          ))}
        </div>
      )}
    </section>
  )
}

// ───────────────── states ─────────────────

function EmptyState({ themeColor }: { themeColor: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-14 text-center"
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
        style={{ backgroundColor: themeColor }}
      >
        <ShoppingBag className="h-5 w-5" />
      </span>
      <p className="mt-4 text-base font-bold text-slate-900">No products yet</p>
      <p className="mt-1 max-w-md text-sm text-slate-500">
        Your clinic hasn't added products to the storefront yet. Check back soon —
        new items appear here as the team curates them.
      </p>
    </div>
  )
}

function WrongClinicNotice({
  clinicName,
  themeColor,
}: {
  clinicName: string
  themeColor: string
}) {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12 lg:px-8">
      <div
        className="overflow-hidden rounded-3xl border bg-white p-8 text-center"
        style={{ borderColor: `${themeColor}30` }}
      >
        <span
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white"
          style={{ backgroundColor: themeColor }}
        >
          <ShoppingBag className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-xl font-black text-slate-900">
          Sign in with your {clinicName} account
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          You're signed in to a different clinic. The {clinicName} storefront is
          only available to patients of this clinic.
        </p>
      </div>
    </section>
  )
}
