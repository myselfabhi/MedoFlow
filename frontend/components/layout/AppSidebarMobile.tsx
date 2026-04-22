'use client'

import * as React from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { SidebarContent } from './AppSidebar'

interface AppSidebarMobileProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Renders the existing AppSidebar as a slide-in drawer for small viewports.
 * Closes on outside click, Esc, or nav item click (via the Sheet's overlay).
 */
export function AppSidebarMobile({ open, onOpenChange }: AppSidebarMobileProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[280px] border-r-0 bg-[#1E3A5F] p-0 text-white"
        onClick={(event) => {
          // Close on nav item click (bubbles up)
          const target = event.target as HTMLElement
          if (target.closest('a')) {
            onOpenChange(false)
          }
        }}
      >
        <SidebarContent variant="static" />
      </SheetContent>
    </Sheet>
  )
}
