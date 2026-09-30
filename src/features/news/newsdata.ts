/**
 * Crypto headlines from NewsData.io.
 *
 * The API key travels in the query string, so in a browser app it is visible
 * to anyone who opens the network tab. That is acceptable for a free-tier key
 * with a daily quota; a paid key belongs behind a server-side proxy instead.
 */

const API = 'https://newsdata.io/api/1/crypto'

export type NewsArticle = {
  id: string
  title: string
  /** The original article; always http(s), see safeUrl. */
  link: string
  source: string
  sourceIcon: string | null
  imageUrl: string | null
  publishedAt: Date
}

type RawArticle = Record<string, unknown>

/**
 * Only http(s) links are used. Article URLs come from a third party, and an
 * href like "javascript:…" would run code on click.
 */
function safeUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}

/** NewsData sends "2026-05-04 06:08:09" in UTC, without a zone marker. */
function parsePubDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null
  const date = new Date(`${value.trim().replace(' ', 'T')}Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function toArticle(raw: RawArticle): NewsArticle | null {
  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  const link = safeUrl(raw.link)
  const publishedAt = parsePubDate(raw.pubDate)
  if (!title || !link || !publishedAt) return null

  const source =
    (typeof raw.source_name === 'string' && raw.source_name.trim()) ||
    (typeof raw.source_id === 'string' && raw.source_id) ||
    new URL(link).hostname

  return {
    id: typeof raw.article_id === 'string' ? raw.article_id : link,
    title,
    link,
    source,
    sourceIcon: safeUrl(raw.source_icon),
    imageUrl: safeUrl(raw.image_url),
    publishedAt,
  }
}

/**
 * Pick the usable articles out of a response: valid ones only, newest first,
 * and one per title — syndicated stories often arrive several times over.
 */
export function parseArticles(data: unknown): NewsArticle[] {
  if (typeof data !== 'object' || data === null) throw new Error('Unexpected response')
  const body = data as Record<string, unknown>
  if (body.status !== 'success' || !Array.isArray(body.results)) {
    const message =
      typeof body.results === 'object' && body.results !== null
        ? (body.results as Record<string, unknown>).message
        : undefined
    throw new Error(typeof message === 'string' ? message : 'NewsData request failed')
  }

  const seen = new Set<string>()
  const articles: NewsArticle[] = []
  for (const item of body.results) {
    if (typeof item !== 'object' || item === null) continue
    const article = toArticle(item as RawArticle)
    const key = article?.title.toLowerCase()
    if (!article || !key || seen.has(key)) continue
    seen.add(key)
    articles.push(article)
  }
  return articles.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
}

/**
 * The raw response body. Kept separate from parsing so a cached copy can go
 * through exactly the same validation as a fresh one.
 */
export async function fetchCryptoNews(
  apiKey: string,
  { size = 10, signal }: { size?: number; signal?: AbortSignal } = {},
): Promise<unknown> {
  const query = new URLSearchParams({
    apikey: apiKey,
    language: 'en',
    removeduplicate: '1',
    // The free plan caps a request at 10; ask for the most and trim after
    // de-duplication, so the section still fills when some are dropped.
    size: String(size),
  })
  const response = await fetch(`${API}?${query}`, { signal })
  // Error bodies carry a readable message, which parseArticles surfaces.
  return response.json()
}
