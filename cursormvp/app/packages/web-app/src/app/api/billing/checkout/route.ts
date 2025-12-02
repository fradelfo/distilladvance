import { auth } from '@/auth';
import { createCheckoutSession } from '@/lib/billing';
import { STRIPE_PRICES } from '@/lib/stripe';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const checkoutSchema = z.object({
  plan: z.enum(['PRO', 'TEAM']),
  interval: z.enum(['monthly', 'yearly']),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = checkoutSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request',
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { plan, interval } = validationResult.data;

    // Get the correct price ID based on plan and interval
    const priceKey = `${plan}_${interval.toUpperCase()}` as keyof typeof STRIPE_PRICES;
    const priceId = STRIPE_PRICES[priceKey];

    if (!priceId) {
      return NextResponse.json(
        { success: false, message: 'Invalid plan or interval' },
        { status: 400 }
      );
    }

    const checkoutUrl = await createCheckoutSession(session.user.id, priceId, plan);

    if (!checkoutUrl) {
      return NextResponse.json(
        { success: false, message: 'Stripe is not configured' },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true, url: checkoutUrl }, { status: 200 });
  } catch (error) {
    console.error('[Checkout] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
