import { createAdminClient } from '@/lib/supabase/admin'
import type { DrawLogicType, MatchTier } from '@/lib/types'

const POOL_SHARES = { '5match': 0.40, '4match': 0.35, '3match': 0.25 } as const

/**
 * Generate the winning numbers for a draw.
 *
 * DESIGN DECISION (documented assumption — PRD says "weighted by most/least
 * frequent user scores" without specifying direction):
 * We weight toward the MOST frequently occurring scores across all entrants
 * this month. Rationale: this is the more common real-world lottery-adjacent
 * pattern (numbers that reflect actual community performance), and is more
 * defensible/explainable to end users than an "anti-popular" model. This
 * should be called out as a product decision in submission notes, with the
 * "least frequent" mode listed as a documented future toggle.
 */
export async function generateWinningNumbers(
  logicType: DrawLogicType,
  entries: number[][] // each entrant's 5 derived numbers
): Promise<number[]> {
  if (logicType === 'random') {
    return randomFiveFrom1to45()
  }

  // algorithmic: weight by frequency of numbers across all entries this month
  const freq = new Map<number, number>()
  for (let n = 1; n <= 45; n++) freq.set(n, 0)
  for (const entry of entries) {
    for (const n of entry) freq.set(n, (freq.get(n) ?? 0) + 1)
  }

  // Build a weighted pool: each number appears (1 + frequency) times,
  // so even zero-frequency numbers retain a baseline chance.
  const weightedPool: number[] = []
  for (const [num, count] of freq.entries()) {
    const weight = 1 + count
    for (let i = 0; i < weight; i++) weightedPool.push(num)
  }

  const result = new Set<number>()
  while (result.size < 5) {
    const pick = weightedPool[Math.floor(Math.random() * weightedPool.length)]
    result.add(pick)
  }
  return Array.from(result).sort((a, b) => a - b)
}

function randomFiveFrom1to45(): number[] {
  const result = new Set<number>()
  while (result.size < 5) {
    result.add(Math.floor(Math.random() * 45) + 1)
  }
  return Array.from(result).sort((a, b) => a - b)
}

/** Count how many of a user's numbers match the winning numbers. */
export function countMatches(entryNumbers: number[], winningNumbers: number[]): number {
  const winSet = new Set(winningNumbers)
  return entryNumbers.filter((n) => winSet.has(n)).length
}

export function matchCountToTier(matchCount: number): MatchTier | null {
  if (matchCount >= 5) return '5match'
  if (matchCount === 4) return '4match'
  if (matchCount === 3) return '3match'
  return null
}

/**
 * Calculate prize pool tiers from active subscriber count.
 * poolContributionPerSubscriber is the per-subscriber amount contributed to the
 * prize pool (i.e. subscription fee minus charity cut minus platform margin).
 */
export function calculatePrizePool(
  activeSubscriberCount: number,
  poolContributionPerSubscriber: number,
  previousJackpotRollover: number = 0
) {
  const totalPool = activeSubscriberCount * poolContributionPerSubscriber
  return {
    total_pool: totalPool,
    pool_5match: totalPool * POOL_SHARES['5match'] + previousJackpotRollover,
    pool_4match: totalPool * POOL_SHARES['4match'],
    pool_3match: totalPool * POOL_SHARES['3match'],
  }
}

/**
 * Run a full draw: generate numbers, score all entries, compute payouts.
 * Returns a result object WITHOUT writing to DB — used for both
 * simulation (preview) and final publish (caller decides whether to persist).
 */
export async function runDraw(drawId: string) {
  const supabase = createAdminClient()

  const { data: draw, error: drawErr } = await supabase
    .from('draws')
    .select('*')
    .eq('id', drawId)
    .single()
  if (drawErr || !draw) throw new Error('Draw not found')

  const { data: entries, error: entriesErr } = await supabase
    .from('draw_entries')
    .select('*')
    .eq('draw_id', drawId)
  if (entriesErr) throw new Error(entriesErr.message)

  const allEntryNumbers = (entries ?? []).map((e) => e.entry_numbers as number[])
  const winningNumbers = await generateWinningNumbers(draw.logic_type, allEntryNumbers)

  const scored = (entries ?? []).map((entry) => {
    const matchCount = countMatches(entry.entry_numbers, winningNumbers)
    const tier = matchCountToTier(matchCount)
    return { ...entry, match_count: matchCount, tier }
  })

  const winnersByTier: Record<MatchTier, typeof scored> = {
    '5match': scored.filter((s) => s.tier === '5match'),
    '4match': scored.filter((s) => s.tier === '4match'),
    '3match': scored.filter((s) => s.tier === '3match'),
  }

  const payouts: { user_id: string; tier: MatchTier; amount: number }[] = []
  let jackpotRollsOver = false

  for (const tier of ['5match', '4match', '3match'] as MatchTier[]) {
    const winners = winnersByTier[tier]
    const poolKey = tier === '5match' ? 'pool_5match' : tier === '4match' ? 'pool_4match' : 'pool_3match'
    const pool = draw[poolKey] as number

    if (tier === '5match' && winners.length === 0) {
      jackpotRollsOver = true
      continue
    }
    if (winners.length === 0) continue

    const share = pool / winners.length
    for (const w of winners) {
      payouts.push({ user_id: w.user_id, tier, amount: share })
    }
  }

  return {
    draw,
    winningNumbers,
    scoredEntries: scored,
    payouts,
    jackpotRollsOver,
  }
}
