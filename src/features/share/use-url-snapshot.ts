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
 * The last calculation, kept for this tab. Leaving for another page and coming
 * back through the menu lands on a bare "/", which would otherwise reset the
 * calculator; sessionStorage brings the numbers back without outliving the tab.
 */
const LAST_QUERY_KEY = 'pnl-master:last-calculation'

export function recallLastQuery(): URLSearchParams {
  try {
    return new URLSearchParams(sessionStorage.getItem(LAST_QUERY_KEY) ?? '')
  } catch {
    return new URLSearchParams()
  }
}

function rememberQuery(query: string) {
  try {
    sessionStorage.setItem(LAST_QUERY_KEY, query)
  } catch {
    // Not remembering it only costs the convenience.
  }
}

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
      rememberQuery(query)
      if (window.location.search.slice(1) === query) return
      setParams.current(new URLSearchParams(query), { replace: true, preventScrollReset: true })
    }, WRITE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [query])
}
