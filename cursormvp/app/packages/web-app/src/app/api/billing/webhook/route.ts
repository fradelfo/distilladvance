import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import {
  createSubscriptionFromCheckout,
  updateSubscriptionFromStripe,
  handleSubscriptionDeleted,
} from '@/lib/billing';
import type { PlanType } from '@/lib/stripe';

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!stripe) {
    console.warn('[Webhook] Stripe not configured');
    return NextResponse.json(
      { success: false, message: 'Stripe not configured' },
      { status: 503 }
    );
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { success: false, message: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Webhook] Signature verification failed:', message);
    return NextResponse.json(
      { success: false, message: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'subscription' && session.subscription) {
          const subscriptionId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id;

          const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
          const subscription = subscriptionResponse as Stripe.Subscription;
          const userId = session.metadata?.userId;
          const plan = (session.metadata?.plan || 'PRO') as PlanType;

          if (userId) {
            // Access subscription period timestamps
            const sub = subscription as unknown as { current_period_start: number; current_period_end: number };
            const periodStart = sub.current_period_start || Math.floor(Date.now() / 1000);
            const periodEnd = sub.current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

            await createSubscriptionFromCheckout(
              userId,
              subscription.id,
              subscription.items.data[0]?.price.id || '',
              plan,
              new Date(periodStart * 1000),
              new Date(periodEnd * 1000)
            );
            console.log('[Webhook] Subscription created for user:', userId);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        // Access subscription period timestamps
        const sub = subscription as unknown as { current_period_start: number; current_period_end: number };
        const periodStart = sub.current_period_start || Math.floor(Date.now() / 1000);
        const periodEnd = sub.current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

        await updateSubscriptionFromStripe(
          subscription.id,
          subscription.status,
          new Date(periodStart * 1000),
          new Date(periodEnd * 1000),
          subscription.cancel_at_period_end,
          subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
        );
        console.log('[Webhook] Subscription updated:', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        await handleSubscriptionDeleted(subscription.id);
        console.log('[Webhook] Subscription deleted:', subscription.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('[Webhook] Payment succeeded for invoice:', invoice.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('[Webhook] Payment failed for invoice:', invoice.id);
        // Could send email notification here
        break;
      }

      default:
        console.log('[Webhook] Unhandled event type:', event.type);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error('[Webhook] Error processing event:', error);
    return NextResponse.json(
      { success: false, message: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
