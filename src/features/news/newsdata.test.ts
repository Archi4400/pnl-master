import { describe, expect, it } from 'vitest'

import { parseArticles } from './newsdata'

const article = (overrides: Record<string, unknown> = {}) => ({
  article_id: 'a1',
  title: 'Bitcoin climbs',
  link: 'https://example.com/btc',
  source_name: 'Example News',
  source_icon: 'https://example.com/icon.png',
  image_url: 'https://example.com/pic.jpg',
  pubDate: '2026-09-30 10:00:00',
  ...overrides,
})

describe('parseArticles', () => {
  it('maps the fields the section shows', () => {
    const [first] = parseArticles({ status: 'success', results: [article()] })
    expect(first).toEqual({
      id: 'a1',
      title: 'Bitcoin climbs',
      link: 'https://example.com/btc',
      source: 'Example News',
      sourceIcon: 'https://example.com/icon.png',
      imageUrl: 'https://example.com/pic.jpg',
      publishedAt: new Date('2026-09-30T10:00:00Z'),
    })
  })

  it('reads the publish time as UTC', () => {
    const [first] = parseArticles({ status: 'success', results: [article()] })
    expect(first?.publishedAt.toISOString()).toBe('2026-09-30T10:00:00.000Z')
  })

  it('sorts newest first', () => {
    const results = [
      article({ article_id: 'old', title: 'Old', pubDate: '2026-09-29 10:00:00' }),
      article({ article_id: 'new', title: 'New', pubDate: '2026-09-30 12:00:00' }),
    ]
    expect(parseArticles({ status: 'success', results }).map((a) => a.id)).toEqual(['new', 'old'])
  })

  it('keeps one copy of a syndicated headline', () => {
    const results = [article(), article({ article_id: 'a2', title: 'BITCOIN CLIMBS' })]
    expect(parseArticles({ status: 'success', results })).toHaveLength(1)
  })

  it('drops articles whose link is not http(s)', () => {
    const results = [article({ link: 'javascript:alert(1)' })]
    expect(parseArticles({ status: 'success', results })).toEqual([])
  })

  it('drops untrusted icon and image urls but keeps the article', () => {
    const [first] = parseArticles({
      status: 'success',
      results: [article({ image_url: 'data:image/png;base64,xx', source_icon: null })],
    })
    expect(first?.imageUrl).toBeNull()
    expect(first?.sourceIcon).toBeNull()
  })

  it('falls back to the link host when the source has no name', () => {
    const [first] = parseArticles({
      status: 'success',
      results: [article({ source_name: null, source_id: null })],
    })
    expect(first?.source).toBe('example.com')
  })

  it('throws the API message on an error response', () => {
    expect(() =>
      parseArticles({
        status: 'error',
        results: { message: 'The provided API key is not valid.' },
      }),
    ).toThrow('The provided API key is not valid.')
  })
})
