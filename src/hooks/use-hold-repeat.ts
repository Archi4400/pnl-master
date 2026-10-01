import { useCallback, useEffect, useRef } from 'react'

import { useLatest } from './use-latest'

// A held button waits a beat before repeating, like a native spin button, so a
// single click never fires twice.
const REPEAT_DELAY_MS = 400
const REPEAT_INTERVAL_MS = 60

/**
 * Press-and-hold auto-repeat: `start` fires once immediately, then keeps firing
 * until `stop`. The action is read through a ref, so a hold that spans many
 * re-renders always runs the current one.
 */
export function useHoldRepeat<T>(action: (arg: T) => void) {
  const latestAction = useLatest(action)
  // One stable object for the whole life of the component, so the unmount
  // cleanup can capture it and still see whichever timer is live at that moment.
  const repeat = useRef<{ timer: ReturnType<typeof setTimeout> | null }>({ timer: null })

  const stop = useCallback(() => {
    if (repeat.current.timer !== null) clearTimeout(repeat.current.timer)
    repeat.current.timer = null
  }, [])

  const start = useCallback(
    (arg: T) => {
      stop()
      latestAction.current(arg)
      const tick = () => {
        latestAction.current(arg)
        repeat.current.timer = setTimeout(tick, REPEAT_INTERVAL_MS)
      }
      repeat.current.timer = setTimeout(tick, REPEAT_DELAY_MS)
    },
    [latestAction, stop],
  )

  // Unmounted mid-hold (e.g. the calculator switched away) must not keep ticking.
  useEffect(() => {
    const state = repeat.current
    return () => {
      if (state.timer !== null) clearTimeout(state.timer)
    }
    // `repeat` is a ref and never changes; listed only to satisfy the linter.
  }, [repeat])

  return { start, stop }
}
