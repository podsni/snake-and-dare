import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../utils/cn.ts'

type Variant = 'primary' | 'secondary' | 'ghost' | 'pink' | 'sun'

const styles: Record<Variant, string> = {
  primary: 'bg-grape text-white shadow-pop hover:brightness-110',
  secondary: 'bg-white text-ink shadow-pop hover:bg-cream',
  ghost: 'bg-white/70 text-ink hover:bg-white',
  pink: 'bg-candy text-white shadow-pop hover:brightness-110',
  sun: 'bg-sun text-ink shadow-pop hover:brightness-105',
}

export function Button({
  variant = 'primary',
  className,
  children,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-base font-extrabold transition active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
