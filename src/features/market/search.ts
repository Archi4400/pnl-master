/**
 * The picker's list order.
 *
 * Without a query: popular coins first, in their fixed order, then everything
 * else alphabetically, so the list can be scrolled end to end.
 *
 * With a query: exact ticker first, then tickers starting with it, then the
 * rest that contain it — so "ETH" puts ETH above ETHFI. Popular coins win ties,
 * so "SO" lists SOL before an obscure SOxx.
 */
export function orderAssets(
  assets: Iterable<string>,
  query: string,
  popular: readonly string[],
): string[] {
  const q = query.trim().toUpperCase()
  const popularRank = new Map(popular.map((asset, index) => [asset, index]))
  const byPopularity = (a: string, b: string) =>
    (popularRank.get(a) ?? Infinity) - (popularRank.get(b) ?? Infinity)

  const all = [...assets]
  if (!q) {
    return all.sort((a, b) => byPopularity(a, b) || a.localeCompare(b))
  }

  const matchRank = (asset: string) => (asset === q ? 0 : asset.startsWith(q) ? 1 : 2)
  return all
    .filter((asset) => asset.includes(q))
    .sort(
      (a, b) =>
        matchRank(a) - matchRank(b) ||
        byPopularity(a, b) ||
        a.length - b.length ||
        a.localeCompare(b),
    )
}
