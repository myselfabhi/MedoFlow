import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getGreetingName(name: string | undefined | null, fallback: string): string {
  if (!name) return fallback
  const parts = name.trim().split(/\s+/)
  const first = parts[0]
  if (
    parts.length > 1 &&
    first &&
    (first.toLowerCase() === 'dr' || first.toLowerCase() === 'dr.')
  ) {
    return `${first} ${parts[1]}`
  }
  return first || fallback
}
