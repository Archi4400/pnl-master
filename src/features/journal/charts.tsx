import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'

import { formatAmount } from '@/lib/number'
import { cn } from '@/lib/utils'

import type { Side } from './csv'
import { formatDate, formatDateTime, formatMoney, formatQty, formatUnitPrice } from './format'
import type { MonthVolume, TimelinePoint } from './stats'

/*
 * Colour roles:
 *   buy = brand lime (--color-chart-buy), sell = loss red, on every chart,
 *   legend and tooltip that shows a side, so one colour means one side across
 *   the journal. That pair fails the deuteranopia check, so the side is always
 *   also carried by shape (▲ buy, ▼ sell), by the tooltip, and in stacks by
 *   order (buy below, sell on top).
 *   Single-series lines (position, average entry) use categorical slot 1.
 */
type SidePalette = { buy: string; sell: string }
const SIDE_COLORS: SidePalette = { buy: 'var(--color-chart-buy)', sell: 'var(--color-loss)' }
const LINE = 'var(--color-chart-1)'
/** The allocation donut's earthy palette (--color-alloc-* in index.css), in fixed order. */
const ALLOCATION = [
  'var(--color-alloc-1)',
  'var(--color-alloc-2)',
  'var(--color-alloc-3)',
  'var(--color-alloc-4)',
  'var(--color-alloc-5)',
  'var(--color-alloc-6)',
  'var(--color-alloc-7)',
]
const OTHER = 'var(--color-chart-other)'
const SURFACE = 'var(--color-surface-raised)'
const GRID = 'var(--color-line)'
const AXIS_TICK = { fill: 'var(--color-content-faint)', fontSize: 11 }
const CURSOR = { stroke: 'var(--color-content-faint)', strokeDasharray: '3 3' }

const CHART_HEIGHT = 240

function useLocale() {
  return useTranslation().i18n.resolvedLanguage
}

// --- Shared pieces --------------------------------------------------------------

type TooltipRow = { key: string; label: React.ReactNode; value: string }

/** The tooltip bubble shared by every chart: page ground, text in ink tokens. */
function TooltipBox({ title, rows }: { title: string; rows: TooltipRow[] }) {
  return (
    <div className="border-line bg-surface-raised rounded-xl border px-3 py-2 text-xs shadow-[0_12px_32px_-12px_rgba(0,0,0,0.45)]">
      <p className="text-content-faint mb-1 font-mono text-[11px]">{title}</p>
      {rows.map((row) => (
        <p
          key={row.key}
          className="text-content flex items-center justify-between gap-4 tabular-nums"
        >
          <span className="text-content-muted flex items-center gap-1.5">{row.label}</span>
          <span>{row.value}</span>
        </p>
      ))}
    </div>
  )
}

function Swatch({ color, shape = 'square' }: { color: string; shape?: 'square' | 'up' | 'down' }) {
  if (shape === 'square') {
    return (
      <span className="size-2.5 shrink-0 rounded-sm" style={{ background: color }} aria-hidden />
    )
  }
  return (
    <span className="text-[10px] leading-none" style={{ color }} aria-hidden>
      {shape === 'up' ? '▲' : '▼'}
    </span>
  )
}

function SideLabel({ side }: { side: Side }) {
  const { t } = useTranslation()
  return (
    <>
      <Swatch color={SIDE_COLORS[side]} shape={side === 'buy' ? 'up' : 'down'} />
      {t(`journal.side.${side}`)}
    </>
  )
}

/**
 * What the y axis measures and in which unit ("Price, USDT"). Ticks stay bare
 * numbers so they fit; the unit is said once, above the plot.
 */
function AxisCaption({ children }: { children: React.ReactNode }) {
  return <p className="text-content-faint font-mono text-[11px] tracking-wider">{children}</p>
}

/** Buy/sell legend, shared by the charts that use the pair. */
export function BuySellLegend() {
  return (
    <ul className="text-content-muted flex flex-wrap gap-4 text-xs">
      <li className="flex items-center gap-1.5">
        <SideLabel side="buy" />
      </li>
      <li className="flex items-center gap-1.5">
        <SideLabel side="sell" />
      </li>
    </ul>
  )
}

/**
 * Tooltips are passed to Recharts as elements; it clones them with the hover
 * state (active, payload, label) merged into these props.
 */
type TooltipProps<Extra> = Partial<TooltipContentProps> & Extra

function timelinePoint(payload: TooltipContentProps['payload'] | undefined) {
  return payload?.[0]?.payload as TimelinePoint | undefined
}

function timeAxis(locale: string | undefined) {
  return {
    dataKey: 'time',
    type: 'number' as const,
    scale: 'time' as const,
    domain: ['dataMin', 'dataMax'] as [string, string],
    tickFormatter: (time: number) => formatDate(time, locale),
    tick: AXIS_TICK,
    tickLine: false,
    axisLine: { stroke: GRID },
    minTickGap: 32,
  }
}

// --- Portfolio: allocation donut -----------------------------------------------

/** Seven named slices at most; the rest fold into "Other" rather than a new hue. */
const DONUT_SLICES = 7

/** `qty` is the coins the money bought; absent for "Other", which mixes coins. */
type Slice = { name: string; value: number; color: string; qty?: number }

function DonutTooltip({
  active,
  payload,
  quote,
  total,
}: TooltipProps<{ quote: string; total: number }>) {
  const { t } = useTranslation()
  const locale = useLocale()
  const slice = payload?.[0]?.payload as Slice | undefined
  if (!active || !slice) return null
  return (
    <TooltipBox
      title={slice.name}
      rows={[
        {
          key: 'amount',
          label: t('journal.charts.spent'),
          value: `${formatMoney(slice.value, quote, locale)} ${quote}`,
        },
        ...(slice.qty !== undefined
          ? [
              {
                key: 'coins',
                label: t('journal.charts.coins'),
                value: `${formatQty(slice.qty, locale)} ${slice.name}`,
              },
            ]
          : []),
        {
          key: 'share',
          label: t('journal.charts.share'),
          value: `${formatAmount((slice.value / total) * 100, locale, 1)}%`,
        },
      ]}
    />
  )
}

export function AllocationDonut({
  data,
  quote,
}: {
  data: { asset: string; invested: number; qty: number }[]
  quote: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const sorted = [...data].sort((a, b) => b.invested - a.invested)
  const rest = sorted.slice(DONUT_SLICES).reduce((sum, item) => sum + item.invested, 0)
  const slices: Slice[] = [
    ...sorted.slice(0, DONUT_SLICES).map((item, index) => ({
      name: item.asset,
      value: item.invested,
      qty: item.qty,
      color: ALLOCATION[index] as string,
    })),
    ...(rest > 0 ? [{ name: t('journal.charts.other'), value: rest, color: OTHER }] : []),
  ]
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[200px_1fr]">
      <div className="mx-auto size-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={96}
              // A 2px ring of the surface between slices keeps them apart
              // without relying on colour difference alone.
              stroke={SURFACE}
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip quote={quote} total={total} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* The legend doubles as the direct labels: what was spent in the quote
          currency, how many coins it bought, and the share of the total. */}
      <ul className="flex flex-col gap-2 text-sm">
        {slices.map((slice) => (
          <li key={slice.name} className="flex items-center gap-2">
            <Swatch color={slice.color} />
            <span className="font-medium">{slice.name}</span>
            <span className="ml-auto flex flex-col items-end leading-tight tabular-nums">
              <span>
                {formatMoney(slice.value, quote, locale)}{' '}
                <span className="text-content-faint text-xs">{quote}</span>
              </span>
              {slice.qty !== undefined ? (
                <span className="text-content-faint text-xs">
                  {formatQty(slice.qty, locale)} {slice.name}
                </span>
              ) : null}
            </span>
            <span className="text-content-muted w-14 text-right tabular-nums">
              {formatAmount((slice.value / total) * 100, locale, 1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// --- Portfolio: monthly volume -------------------------------------------------

function monthLabel(month: string, locale?: string) {
  const [year, index] = month.split('-').map(Number) as [number, number]
  return new Intl.DateTimeFormat(locale, { month: 'short', year: '2-digit' }).format(
    new Date(year, index - 1, 1),
  )
}

function VolumeTooltip({ active, payload, label, quote }: TooltipProps<{ quote: string }>) {
  const locale = useLocale()
  const row = payload?.[0]?.payload as MonthVolume | undefined
  if (!active || !row) return null
  return (
    <TooltipBox
      title={monthLabel(String(label), locale)}
      rows={[
        {
          key: 'buy',
          label: <SideLabel side="buy" />,
          value: `${formatMoney(row.buy, quote, locale)} ${quote}`,
        },
        {
          key: 'sell',
          label: <SideLabel side="sell" />,
          value: `${formatMoney(row.sell, quote, locale)} ${quote}`,
        },
      ]}
    />
  )
}

export function MonthlyVolumeChart({ data, quote }: { data: MonthVolume[]; quote: string }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const compact = (value: number) =>
    new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BuySellLegend />
      </div>
      <AxisCaption>{t('journal.charts.volumeAxis', { unit: quote })}</AxisCaption>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis
            dataKey="month"
            tickFormatter={(month: string) => monthLabel(month, locale)}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: GRID }}
            minTickGap={12}
          />
          <YAxis
            tickFormatter={compact}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            cursor={{ fill: 'var(--color-line)', opacity: 0.4 }}
            content={<VolumeTooltip quote={quote} />}
          />
          {/* Stacked, so the bar height is the month's whole volume. */}
          <Bar
            dataKey="buy"
            stackId="volume"
            fill={SIDE_COLORS.buy}
            stroke={SURFACE}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Bar
            dataKey="sell"
            stackId="volume"
            fill={SIDE_COLORS.sell}
            stroke={SURFACE}
            strokeWidth={2}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// --- Asset: trade prices over time ---------------------------------------------

type MarkerProps = { cx?: number; cy?: number }

function Triangle({
  cx,
  cy,
  fill,
  direction,
}: MarkerProps & { fill: string; direction: 'up' | 'down' }) {
  if (cx === undefined || cy === undefined) return null
  const size = 6
  const points =
    direction === 'up'
      ? `${cx},${cy - size} ${cx + size},${cy + size} ${cx - size},${cy + size}`
      : `${cx},${cy + size} ${cx + size},${cy - size} ${cx - size},${cy - size}`
  // The surface-coloured outline keeps overlapping markers legible.
  return <polygon points={points} fill={fill} stroke={SURFACE} strokeWidth={2} />
}

function BuyMarker(props: MarkerProps) {
  return <Triangle cx={props.cx} cy={props.cy} fill={SIDE_COLORS.buy} direction="up" />
}

function SellMarker(props: MarkerProps) {
  return <Triangle cx={props.cx} cy={props.cy} fill={SIDE_COLORS.sell} direction="down" />
}

function PriceTooltip({
  active,
  payload,
  base,
  quote,
}: TooltipProps<{ base: string; quote: string }>) {
  const { t } = useTranslation()
  const locale = useLocale()
  const point = timelinePoint(payload)
  if (!active || !point) return null
  return (
    <TooltipBox
      title={formatDateTime(point.time, locale)}
      rows={[
        {
          key: 'side',
          label: <SideLabel side={point.side} />,
          value: `${formatQty(point.qty, locale)} ${base}`,
        },
        {
          key: 'price',
          label: t('journal.table.price'),
          value: `${formatUnitPrice(point.price, locale)} ${quote}`,
        },
        {
          key: 'total',
          label: t('journal.table.total'),
          value: `${formatMoney(point.total, quote, locale)} ${quote}`,
        },
      ]}
    />
  )
}

export function PriceTimelineChart({
  timeline,
  avgPrice,
  currentPrice,
  base,
  quote,
}: {
  timeline: TimelinePoint[]
  avgPrice: number | null
  /** Live market price; the line and its toggle appear once it has loaded. */
  currentPrice: number | undefined
  base: string
  quote: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const [showCurrent, setShowCurrent] = useState(true)
  const currentLine = showCurrent ? currentPrice : undefined
  const buys = timeline.filter((point) => point.side === 'buy')
  const sells = timeline.filter((point) => point.side === 'sell')

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BuySellLegend />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {avgPrice !== null ? (
            <span className="text-content-muted flex items-center gap-1.5 text-xs">
              <span className="border-content-muted w-4 border-t-2 border-dashed" aria-hidden />
              {t('journal.charts.avgLine', {
                price: `${formatUnitPrice(avgPrice, locale)} ${quote}`,
              })}
            </span>
          ) : null}
          {currentPrice !== undefined ? (
            // The legend entry doubles as the switch: press to hide or show the line.
            <button
              type="button"
              aria-pressed={showCurrent}
              onClick={() => setShowCurrent((on) => !on)}
              className={cn(
                'border-line hover:border-lime flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
                'focus-visible:ring-lime/40 focus-visible:ring-4 focus-visible:outline-none',
                showCurrent ? 'text-content' : 'text-content-faint',
              )}
            >
              <span
                className={cn(
                  'w-4 border-t-2',
                  showCurrent ? 'border-content' : 'border-content-faint',
                )}
                aria-hidden
              />
              {t('journal.charts.currentLine', {
                price: `${formatUnitPrice(currentPrice, locale)} ${quote}`,
              })}
            </button>
          ) : null}
        </div>
      </div>
      <AxisCaption>{t('journal.charts.priceAxis', { unit: quote })}</AxisCaption>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <ComposedChart data={timeline} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis {...timeAxis(locale)} />
          <YAxis
            dataKey="price"
            domain={['auto', 'auto']}
            tickFormatter={(value: number) => formatUnitPrice(value, locale)}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip cursor={CURSOR} content={<PriceTooltip base={base} quote={quote} />} />
          {/* The price path is context; the markers carry the story. */}
          <Line
            dataKey="price"
            stroke="var(--color-content-faint)"
            strokeWidth={1.5}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
          {avgPrice !== null ? (
            <ReferenceLine
              y={avgPrice}
              stroke="var(--color-content-muted)"
              strokeDasharray="6 4"
              strokeWidth={1.5}
            />
          ) : null}
          {currentLine !== undefined ? (
            <ReferenceLine
              y={currentLine}
              stroke="var(--color-content)"
              strokeWidth={1.5}
              // The market may sit outside every trade price; stretch the axis to show it.
              ifOverflow="extendDomain"
            />
          ) : null}
          {/* An empty Scatter falls back to the chart's own data and would mark
              every trade with that side, so a side with no trades renders none. */}
          {buys.length > 0 ? (
            <Scatter data={buys} dataKey="price" isAnimationActive={false} shape={BuyMarker} />
          ) : null}
          {sells.length > 0 ? (
            <Scatter data={sells} dataKey="price" isAnimationActive={false} shape={SellMarker} />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// --- Asset: position and average over time -------------------------------------

function PositionTooltip({ active, payload, base }: TooltipProps<{ base: string }>) {
  const { t } = useTranslation()
  const locale = useLocale()
  const point = timelinePoint(payload)
  if (!active || !point) return null
  return (
    <TooltipBox
      title={formatDateTime(point.time, locale)}
      rows={[
        {
          key: 'position',
          label: t('journal.metrics.position'),
          value: `${formatQty(point.position, locale)} ${base}`,
        },
      ]}
    />
  )
}

export function PositionChart({ timeline, base }: { timeline: TimelinePoint[]; base: string }) {
  const { t } = useTranslation()
  const locale = useLocale()
  return (
    <div className="flex flex-col gap-3">
      <AxisCaption>{t('journal.charts.amountAxis', { unit: base })}</AxisCaption>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <AreaChart data={timeline} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis {...timeAxis(locale)} />
          <YAxis
            tickFormatter={(value: number) => formatAmount(value, locale, 4)}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={64}
          />
          <Tooltip cursor={CURSOR} content={<PositionTooltip base={base} />} />
          {/* Step: the position holds until the next trade, it does not glide. */}
          <Area
            type="stepAfter"
            dataKey="position"
            stroke={LINE}
            strokeWidth={2}
            fill={LINE}
            fillOpacity={0.15}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function AvgTooltip({ active, payload, quote }: TooltipProps<{ quote: string }>) {
  const { t } = useTranslation()
  const locale = useLocale()
  const point = timelinePoint(payload)
  if (!active || !point) return null
  return (
    <TooltipBox
      title={formatDateTime(point.time, locale)}
      rows={[
        {
          key: 'avg',
          label: t('journal.metrics.avgPrice'),
          value:
            point.avgPrice === null
              ? t('journal.charts.flat')
              : `${formatUnitPrice(point.avgPrice, locale)} ${quote}`,
        },
      ]}
    />
  )
}

export function AvgPriceChart({ timeline, quote }: { timeline: TimelinePoint[]; quote: string }) {
  const { t } = useTranslation()
  const locale = useLocale()
  return (
    <div className="flex flex-col gap-3">
      <AxisCaption>{t('journal.charts.priceAxis', { unit: quote })}</AxisCaption>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <LineChart data={timeline} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis {...timeAxis(locale)} />
          <YAxis
            domain={['auto', 'auto']}
            tickFormatter={(value: number) => formatUnitPrice(value, locale)}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip cursor={CURSOR} content={<AvgTooltip quote={quote} />} />
          {/* Gaps where the position was flat: there was no average then. */}
          <Line
            type="stepAfter"
            dataKey="avgPrice"
            stroke={LINE}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
