import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resendVerificationEmail } from '@/lib/email-verification';

const resendSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const validationResult = resendSchema.safeParse(body);
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

    const { email } = validationResult.data;
    const result = await resendVerificationEmail(email.toLowerCase());

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.error || 'Failed to send verification email',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Verification email sent',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ResendVerification] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
