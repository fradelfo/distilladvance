import { auth } from '@/auth';
import { createPortalSession } from '@/lib/billing';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const portalUrl = await createPortalSession(session.user.id);

    if (!portalUrl) {
      return NextResponse.json(
        { success: false, message: 'Stripe is not configured or no customer found' },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true, url: portalUrl }, { status: 200 });
  } catch (error) {
    console.error('[Portal] Error:', error);

    const message = error instanceof Error ? error.message : 'Failed to create portal session';

    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
