export type UserRole = 'subscriber' | 'admin'
export type SubscriptionPlan = 'monthly' | 'yearly'
export type SubscriptionStatus = 'active' | 'cancelled' | 'lapsed' | 'incomplete'
export type DrawLogicType = 'random' | 'algorithmic'
export type DrawStatus = 'draft' | 'simulated' | 'published'
export type PayoutStatus = 'pending' | 'paid' | 'rejected'
export type MatchTier = '5match' | '4match' | '3match'

export interface Profile {
  id: string
  full_name: string | null
  role: UserRole
  charity_id: string | null
  charity_contribution_pct: number
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface Charity {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  category: string | null
  is_featured: boolean
  is_active: boolean
  created_at: string
}

export interface CharityEvent {
  id: string
  charity_id: string
  title: string
  description: string | null
  event_date: string | null
  created_at: string
}

export interface Score {
  id: string
  user_id: string
  score: number
  played_on: string
  created_at: string
}

export interface Draw {
  id: string
  draw_month: string
  logic_type: DrawLogicType
  status: DrawStatus
  winning_numbers: number[]
  total_pool: number
  pool_5match: number
  pool_4match: number
  pool_3match: number
  jackpot_rollover: number
  jackpot_claimed: boolean
  published_at: string | null
  created_by: string | null
  created_at: string
}

export interface DrawEntry {
  id: string
  draw_id: string
  user_id: string
  entry_numbers: number[]
  match_count: number
  tier: MatchTier | null
  created_at: string
}

export interface Winner {
  id: string
  draw_id: string
  user_id: string
  tier: MatchTier
  amount: number
  proof_url: string | null
  status: PayoutStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface Donation {
  id: string
  user_id: string | null
  charity_id: string
  amount: number
  stripe_payment_id: string | null
  created_at: string
}
