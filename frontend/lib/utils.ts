import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getGreetingName(name: string | undefined | null, fallback: string): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1 && (parts[0].toLowerCase() === 'dr' || parts[0].toLowerCase() === 'dr.')) {
    return `${parts[0]} ${parts[1]}`;
  }
  return parts[0] || fallback;
}
