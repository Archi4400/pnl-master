import { useTranslation } from 'react-i18next'

import { Marker } from '@/components/ui/marker'
import { SectionLabel } from '@/components/ui/section-label'
import { useReveal } from '@/hooks/use-reveal'
import { cn } from '@/lib/utils'

/** "Leverage, plainly": three explainer cards below the calculators. */
export function InfoSection() {
  const { t } = useTranslation()
  const { ref, revealed } = useReveal<HTMLElement>()

  const cards = [
    { index: '01', title: t('info.liquidationTitle'), body: t('info.liquidationBody') },
    { index: '02', title: t('info.feesTitle'), body: t('info.feesBody') },
    { index: '03', title: t('info.asymmetryTitle'), body: t('info.asymmetryBody') },
  ]

  return (
    <section ref={ref} id="learn" className="mx-auto w-full max-w-6xl scroll-mt-16 px-5 py-20">
      <SectionLabel index="03">{t('info.eyebrow')}</SectionLabel>

      <div className="mt-6 grid gap-x-12 gap-y-5 lg:grid-cols-[1.15fr_1fr]">
        <h2 className="text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.02] font-medium tracking-[-0.03em] text-balance">
          {t('info.titleLead')} <Marker>{t('info.titleMarked')}</Marker>
        </h2>
        <p className="text-content-muted max-w-[46ch] self-end">{t('info.intro')}</p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <article
            key={card.index}
            data-reveal
            className={cn(
              'rounded-card border-line bg-surface-raised flex flex-col gap-3 border p-6',
              'ease-brand hover:border-content transition-all duration-300 hover:-translate-y-1',
              // Reveal on scroll rather than on load: these sit below the fold.
              revealed ? 'animate-rise' : 'opacity-0',
            )}
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span className="text-lime font-mono text-xs tracking-widest">{card.index}</span>
            <h3 className="text-lg font-semibold tracking-tight">{card.title}</h3>
            <p className="text-content-muted text-sm leading-relaxed">{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
