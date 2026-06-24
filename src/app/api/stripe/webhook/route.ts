import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature!, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      const plan = session.metadata?.plan as 'monthly' | 'yearly'
      if (!userId) break

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      const item = subscription.items.data[0] as any

      await supabase.from('subscriptions').insert({
        user_id: userId,
        plan,
        status: 'active',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        current_period_start: new Date(item.current_period_start * 1000).toISOString(),
        current_period_end: new Date(item.current_period_end * 1000).toISOString(),
      })
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const item = sub.items.data[0] as any
      const status = sub.status === 'active' ? 'active' : sub.status === 'canceled' ? 'cancelled' : 'lapsed'

      await supabase
        .from('subscriptions')
        .update({
          status,
          cancel_at_period_end: sub.cancel_at_period_end,
          current_period_start: new Date(item.current_period_start * 1000).toISOString(),
          current_period_end: new Date(item.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.subscription) {
        await supabase
          .from('subscriptions')
          .update({ status: 'lapsed' })
          .eq('stripe_subscription_id', invoice.subscription as string)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}