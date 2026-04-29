'use client'

/**
 * ClinicProductCard — themed product tile used by <ClinicStorefront>.
 *
 * No image upload exists for products yet, so we use the existing
 * `categorize()` helper from `lib/product-categories` to give every
 * card a category-derived gradient + icon (same one the generic /store
 * uses). The clinic accent color tints the price chip and Add button.
 */

import React from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { categorize } from '@/lib/product-categories'

interface Product {
  id: string
  name: string
  description?: string | null
  price: string | number
  inventoryItem?: { quantityInStock: number } | null
}

interface Props {
  product: Product
  themeColor: string
  onAdd: (product: Product) => void
  /** When true, renders a more compact card for the preview row. */
  compact?: boolean
}

export function ClinicProductCard({ product, themeColor, onAdd, compact }: Props) {
  const cat = categorize(product.name)
  const Icon = cat.icon
  const price = Number(product.price)
  const stock = product.inventoryItem?.quantityInStock
  const outOfStock = typeof stock === 'number' && stock <= 0

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white transition-all',
        'hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md'
      )}
    >
      {/* Image area — gradient + category icon */}
      <div
        className={cn(
          'relative flex items-center justify-center bg-gradient-to-br',
          cat.gradient,
          compact ? 'h-28' : 'h-40'
        )}
      >
        <Icon className={compact ? 'h-10 w-10' : 'h-14 w-14'} style={{ color: cat.accentHex }} strokeWidth={1.5} />
        {outOfStock && (
          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-600 shadow-sm">
            Sold out
          </span>
        )}
      </div>

      {/* Body */}
      <div className={cn('flex flex-1 flex-col gap-2 p-4', compact && 'p-3 gap-1.5')}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {cat.label}
        </p>
        <h3 className={cn('font-bold text-slate-900 leading-tight', compact ? 'text-[13px]' : 'text-[15px]')}>
          {product.name}
        </h3>
        {!compact && product.description && (
          <p className="line-clamp-2 text-[13px] text-slate-500">{product.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className={cn('font-black text-slate-900', compact ? 'text-[15px]' : 'text-[18px]')}>
            ${price.toFixed(2)}
          </span>
          <button
            type="button"
            onClick={() => onAdd(product)}
            disabled={outOfStock}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold text-white shadow-sm transition-all',
              'hover:opacity-90 hover:shadow disabled:cursor-not-allowed disabled:opacity-50'
            )}
            style={{ backgroundColor: themeColor }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>
    </article>
  )
}
