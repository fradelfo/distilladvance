import { verifyEmailToken } from '@/lib/email-verification';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const verifySchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const validationResult = verifySchema.safeParse(body);
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

    const { token } = validationResult.data;
    const result = await verifyEmailToken(token);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.error || 'Failed to verify email',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully',
        email: result.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[VerifyEmail] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
