import { ArrowUpRight, Newspaper } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Marker } from '@/components/ui/marker'
import { SectionLabel } from '@/components/ui/section-label'
import { useReveal } from '@/hooks/use-reveal'
import { formatRelativeTime } from '@/lib/time'
import { cn } from '@/lib/utils'

import type { NewsArticle } from './newsdata'
import { NEWS_API_KEY, useNews } from './use-news'

/** A handful is enough: this is a pulse check, not a news reader. */
const NEWS_COUNT = 4

const CARD_CLASS = cn(
  'rounded-card border-line bg-surface-raised flex h-full flex-col overflow-hidden border',
  'ease-brand transition-all duration-300',
)

export function NewsSection() {
  const { t } = useTranslation()
  // Waits until the section is near the screen before spending an API credit.
  const { ref, revealed } = useReveal<HTMLElement>()
  const news = useNews(revealed)
  const articles = news.data?.slice(0, NEWS_COUNT) ?? []

  // Without a key there is nothing to show, so production drops the section.
  // In development it stays, saying how to switch it on.
  if (NEWS_API_KEY === null && !import.meta.env.DEV) return null

  let body: React.ReactNode
  if (NEWS_API_KEY === null) {
    body = <Notice>{t('news.missingKey')}</Notice>
  } else if (news.isError && articles.length === 0) {
    body = (
      <Notice>
        <span>{t('news.failed')}</span>
        <Button variant="outline" size="sm" onClick={() => void news.refetch()}>
          {t('news.retry')}
        </Button>
      </Notice>
    )
  } else if (articles.length === 0 && (news.isFetching || news.isPending || !revealed)) {
    body = <NewsSkeleton label={t('news.loading')} />
  } else if (articles.length === 0) {
    body = <Notice>{t('news.empty')}</Notice>
  } else {
    body = (
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {articles.map((article, index) => (
          <li
            key={article.id}
            className="animate-rise"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <NewsCard article={article} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section
      ref={ref}
      id="news"
      className="mx-auto w-full max-w-6xl scroll-mt-16 px-5 pt-20 pb-4"
      aria-labelledby="news-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel index="04">{t('news.eyebrow')}</SectionLabel>
        <a
          href="https://newsdata.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-content-faint hover:text-content font-mono text-[11px] tracking-wider underline-offset-2 hover:underline"
        >
          {t('news.poweredBy')}
        </a>
      </div>

      <div className="mt-6 grid gap-x-12 gap-y-5 lg:grid-cols-[1.15fr_1fr]">
        <h2
          id="news-heading"
          className="text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.02] font-medium tracking-[-0.03em] text-balance"
        >
          {t('news.titleLead')} <Marker>{t('news.titleMarked')}</Marker>
        </h2>
        <p className="text-content-muted max-w-[46ch] self-end">{t('news.intro')}</p>
      </div>

      <div className="mt-10">{body}</div>
    </section>
  )
}

/** A dashed placeholder box for the section's non-list states. */
function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-line text-content-faint rounded-card flex flex-wrap items-center justify-between gap-3 border border-dashed px-5 py-6 text-sm">
      {children}
    </div>
  )
}

function NewsCard({ article }: { article: NewsArticle }) {
  const { t, i18n } = useTranslation()
  const [imageFailed, setImageFailed] = useState(false)
  const [iconFailed, setIconFailed] = useState(false)
  const showImage = article.imageUrl !== null && !imageFailed

  return (
    <a
      href={article.link}
      // The original opens in a new tab; noopener keeps it from reaching back
      // into this page through window.opener.
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        CARD_CLASS,
        'group hover:border-lime focus-visible:outline-lime hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2',
      )}
    >
      <div className="bg-line relative aspect-[16/9] overflow-hidden">
        {showImage ? (
          <img
            src={article.imageUrl ?? undefined}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="ease-brand size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="text-content-faint flex size-full items-center justify-center">
            <Newspaper className="size-8" aria-hidden />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <p className="text-content-faint flex min-w-0 items-center gap-1.5 font-mono text-[11px] tracking-wider">
          {article.sourceIcon && !iconFailed ? (
            <img
              src={article.sourceIcon}
              alt=""
              width={14}
              height={14}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setIconFailed(true)}
              className="size-3.5 shrink-0 rounded-sm"
            />
          ) : null}
          <span className="truncate">{article.source}</span>
          <span aria-hidden>·</span>
          <time dateTime={article.publishedAt.toISOString()} className="shrink-0">
            {formatRelativeTime(article.publishedAt, new Date(), i18n.resolvedLanguage)}
          </time>
        </p>

        <h3 className="line-clamp-3 text-[15px] leading-snug font-semibold tracking-tight">
          {article.title}
        </h3>

        <span className="text-content-muted group-hover:text-content mt-auto inline-flex items-center gap-1 pt-1 font-mono text-[11px] tracking-wider uppercase transition-colors">
          {t('news.readOriginal')}
          <ArrowUpRight
            className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
          <span className="sr-only">{t('news.opensInNewTab')}</span>
        </span>
      </div>
    </a>
  )
}

function NewsSkeleton({ label }: { label: string }) {
  return (
    // <output> announces the loading state like role="status" would.
    <output className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label={label}>
      {Array.from({ length: NEWS_COUNT }, (_, index) => (
        <div key={index} className={CARD_CLASS} aria-hidden>
          <div className="bg-line aspect-[16/9] animate-pulse" />
          <div className="flex flex-col gap-2.5 p-4">
            <span className="bg-line h-2.5 w-1/2 animate-pulse rounded-sm" />
            <span className="bg-line h-3.5 w-full animate-pulse rounded-sm" />
            <span className="bg-line h-3.5 w-4/5 animate-pulse rounded-sm" />
            <span className="bg-line mt-2 h-2.5 w-1/3 animate-pulse rounded-sm opacity-60" />
          </div>
        </div>
      ))}
    </output>
  )
}
