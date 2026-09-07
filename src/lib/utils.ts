import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes safely.
 *
 * clsx resolves conditionals, twMerge then drops earlier classes that conflict
 * with later ones, so `cn('p-2', 'p-4')` yields 'p-4' instead of both. This is
 * what makes className overrides from a parent component actually win.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
