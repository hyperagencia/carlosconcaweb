'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

/** Entrada animada. `fade={false}` solo desliza: para texto que puede ser el LCP. */
export function Reveal({
  children,
  delay = 0,
  fade = true,
  className,
}: {
  children: ReactNode
  delay?: number
  fade?: boolean
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: fade ? 0 : 1, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
