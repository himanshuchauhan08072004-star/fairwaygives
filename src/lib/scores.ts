import { createClient } from '@/lib/supabase/server'
import type { Score } from '@/lib/types'

export class ScoreError extends Error {}

/**
 * Add a new score for a user, enforcing:
 * - score range 1-45
 * - one score per date (DB unique constraint backs this up)
 * - only the latest 5 scores retained — oldest is deleted if this insert exceeds 5
 */
export async function addScore(userId: string, score: number, playedOn: string) {
  if (score < 1 || score > 45) {
    throw new ScoreError('Score must be between 1 and 45 (Stableford format).')
  }

  const supabase = await createClient()

  const { data: existing, error: fetchErr } = await supabase
    .from('scores')
    .select('id, played_on')
    .eq('user_id', userId)
    .order('played_on', { ascending: false })

  if (fetchErr) throw new ScoreError(fetchErr.message)

  const { error: insertErr } = await supabase
    .from('scores')
    .insert({ user_id: userId, score, played_on: playedOn })

  if (insertErr) {
    if (insertErr.code === '23505') {
      throw new ScoreError('A score already exists for this date. Edit or delete it instead.')
    }
    throw new ScoreError(insertErr.message)
  }

  // Enforce rolling window of 5: if we now have more than 5, delete the oldest.
  const allDates = [...(existing ?? []), { played_on: playedOn }]
  if (allDates.length > 5) {
    const sorted = [...(existing ?? [])].sort(
      (a, b) => new Date(a.played_on).getTime() - new Date(b.played_on).getTime()
    )
    const toDelete = sorted.slice(0, allDates.length - 5)
    if (toDelete.length > 0) {
      await supabase
        .from('scores')
        .delete()
        .in('id', toDelete.map((d) => d.id))
    }
  }

  return getLatestScores(userId)
}

export async function getLatestScores(userId: string): Promise<Score[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', userId)
    .order('played_on', { ascending: false })
    .limit(5)

  if (error) throw new ScoreError(error.message)
  return data ?? []
}

export async function updateScore(userId: string, scoreId: string, newScore: number) {
  if (newScore < 1 || newScore > 45) {
    throw new ScoreError('Score must be between 1 and 45 (Stableford format).')
  }
  const supabase = await createClient()
  const { error } = await supabase
    .from('scores')
    .update({ score: newScore })
    .eq('id', scoreId)
    .eq('user_id', userId)

  if (error) throw new ScoreError(error.message)
}

export async function deleteScore(userId: string, scoreId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('scores')
    .delete()
    .eq('id', scoreId)
    .eq('user_id', userId)

  if (error) throw new ScoreError(error.message)
}

/**
 * Derive a user's 5 draw numbers from their latest scores.
 * DESIGN DECISION (documented assumption — PRD does not specify the exact mapping):
 * Each of the user's 5 most recent scores becomes one draw number, clamped 1-45,
 * giving a 5-number entry per user per draw, matching the 5/4/3-match draw types.
 * If a user has fewer than 5 scores, they are not eligible to enter that month's draw.
 */
export async function deriveDrawNumbers(userId: string): Promise<number[] | null> {
  const scores = await getLatestScores(userId)
  if (scores.length < 5) return null
  return scores.map((s) => s.score).sort((a, b) => a - b)
}
