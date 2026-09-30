import { useEffect, useRef } from 'react'

/**
 * A ref that always holds the latest value.
 *
 * For callbacks that fire long after the render that created them — timers,
 * held buttons — and would otherwise close over a stale value.
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  })
  return ref
}
