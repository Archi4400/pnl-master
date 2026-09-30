import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'

import { encodeSnapshot, type Snapshot } from './snapshot'

/**
 * Writes are held back until typing pauses. Every keystroke would otherwise be
 * a history.replaceState call, and Safari throws once a page makes more than
 * about a hundred of those in thirty seconds.
 */
const WRITE_DELAY_MS = 300

/**
 * Keep the address bar equal to the calculation on screen, so a refresh, a
 * bookmark or a copied URL always reopens exactly what the user sees.
 *
 * The URL is output only: it seeds the calculators once on load (see the page)
 * and from then on just follows them. `replace` keeps the Back button for real
 * navigation rather than one history entry per digit.
 */
export function useUrlSnapshot(snapshot: Snapshot) {
  const [, setSearchParams] = useSearchParams()
  const query = encodeSnapshot(snapshot).toString()

  // The router hands out a new setter after every navigation, including our
  // own writes. Reading it through a ref keeps the timer keyed to the query
  // alone; as an effect dependency it would restart the delay on every write.
  const setParams = useRef(setSearchParams)
  useEffect(() => {
    setParams.current = setSearchParams
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.location.search.slice(1) === query) return
      setParams.current(new URLSearchParams(query), { replace: true, preventScrollReset: true })
    }, WRITE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [query])
}
