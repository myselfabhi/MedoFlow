'use client'

import { useScroll, useTransform, MotionValue } from 'framer-motion'
import { RefObject } from 'react'

/**
 * Returns a motion value that shifts y from `-distance` to `+distance`
 * as the target element scrolls through the viewport.
 *
 * Use on any element to add gentle parallax — closer to camera = larger distance.
 */
export function useParallax(ref: RefObject<HTMLElement>, distance = 80): MotionValue<number> {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  return useTransform(scrollYProgress, [0, 1], [-distance, distance])
}
