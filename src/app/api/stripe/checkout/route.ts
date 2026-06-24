import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json()
  if (plan !== 'monthly' && plan !== 'yearly') {
    return NextResponse.json({ error: 'plan must be "monthly" or "yearly"' }, { status: 400 })
  }

  const priceId = plan === 'monthly'
    ? process.env.STRIPE_PRICE_ID_MONTHLY
    : process.env.STRIPE_PRICE_ID_YEARLY

  if (!priceId) {
    return NextResponse.json({ error: 'Stripe price IDs not configured' }, { status: 500 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/dashboard?subscribed=1`,
    cancel_url: `${siteUrl}/subscribe?cancelled=1`,
    client_reference_id: user.id,
    customer_email: user.email,
    metadata: { user_id: user.id, plan },
  })

  return NextResponse.json({ url: session.url })
}
