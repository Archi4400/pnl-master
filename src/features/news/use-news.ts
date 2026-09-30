import { useQuery } from '@tanstack/react-query'

import { fetchCryptoNews, parseArticles, type NewsArticle } from './newsdata'

/**
 * The free plan's daily credits are shared by every visitor, since the key
 * ships with the page. Headlines a quarter of an hour old are still news, so
 * each browser asks at most that often — across reloads too, via localStorage.
 */
const FRESH_MS = 15 * 60_000
const CACHE_KEY = 'pnl-master:news'

/** Empty or missing means the section has nothing to show and stays hidden. */
export const NEWS_API_KEY = import.meta.env.VITE_NEWSDATA_API_KEY?.trim() || null

/**
 * The cache holds the raw API body, not parsed articles: reading it back runs
 * the same parseArticles as a fresh response, so an edited or outdated entry in
 * storage gets the same validation (and link filtering) as the network does.
 */
type CachedNews = { fetchedAt: number; body: unknown }

function readCache(): { articles: NewsArticle[]; fetchedAt: number } | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return undefined
    const cached = JSON.parse(raw) as Partial<CachedNews>
    if (typeof cached.fetchedAt !== 'number') return undefined
    return { fetchedAt: cached.fetchedAt, articles: parseArticles(cached.body) }
  } catch {
    return undefined
  }
}

function writeCache(body: unknown) {
  try {
    const cached: CachedNews = { fetchedAt: Date.now(), body }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached))
  } catch {
    // Without the cache the next visit simply asks again.
  }
}

/**
 * Latest crypto headlines. `enabled` lets the section wait until it scrolls
 * into view, so a visitor who never gets that far costs no credits.
 */
export function useNews(enabled: boolean) {
  return useQuery({
    queryKey: ['newsdata', 'crypto'],
    queryFn: async ({ signal }) => {
      const body = await fetchCryptoNews(NEWS_API_KEY as string, { signal })
      // Parse first: an error response throws here and never reaches the cache.
      const articles = parseArticles(body)
      writeCache(body)
      return articles
    },
    enabled: enabled && NEWS_API_KEY !== null,
    // A cached copy shows instantly and counts as fresh until FRESH_MS passes.
    // Functions, so storage is read once when the query is created, not on
    // every render.
    initialData: () => readCache()?.articles,
    initialDataUpdatedAt: () => readCache()?.fetchedAt,
    staleTime: FRESH_MS,
    // A bad key or an exhausted quota will not fix itself on retry.
    retry: false,
  })
}
