'use client'

import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-color-scheme: dark)'

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  const mq = matchMedia(QUERY)
  mq.addEventListener('change', onChange)
  return () => {
    observer.disconnect()
    mq.removeEventListener('change', onChange)
  }
}

export function isDarkNow() {
  const cl = document.documentElement.classList
  if (cl.contains('dark')) return true
  if (cl.contains('light')) return false
  return matchMedia(QUERY).matches
}

/** Modo oscuro efectivo: clase forzada (.dark/.light) o preferencia del sistema. */
export function useDark() {
  return useSyncExternalStore(subscribe, isDarkNow, () => false)
}
