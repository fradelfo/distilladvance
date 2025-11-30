'use client';

/**
 * Email Verification Page
 *
 * Handles email verification when user clicks the link from their email.
 */

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [verificationState, setVerificationState] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  const verifyToken = useCallback(async (verificationToken: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken }),
      });

      const result = await response.json();

      if (!response.ok) {
        setVerificationState('error');
        setErrorMessage(result.message || 'Failed to verify email');
        return;
      }

      setVerificationState('success');
      toast.success('Email verified successfully!');
      // Redirect to login after 3 seconds
      setTimeout(() => router.push('/login'), 3000);
    } catch {
      setVerificationState('error');
      setErrorMessage('Failed to verify email. Please try again.');
    }
  }, [router]);

  useEffect(() => {
    if (!token) {
      setVerificationState('no-token');
      return;
    }

    verifyToken(token);
  }, [token, verifyToken]);

  const handleResendVerification = async () => {
    if (!resendEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResending(true);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || 'Failed to send verification email');
        return;
      }

      toast.success('Verification email sent! Check your inbox.');
      setResendEmail('');
    } catch {
      toast.error('Failed to send verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-4xl">💧</span>
            <span className="text-2xl font-bold text-foreground">Distill</span>
          </Link>
        </div>

        <div className="bg-background rounded-lg border shadow-sm p-8">
          {verificationState === 'loading' && (
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-foreground mb-2">
                Verifying your email...
              </h1>
              <p className="text-muted-foreground">
                Please wait while we verify your email address.
              </p>
            </div>
          )}

          {verificationState === 'success' && (
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-foreground mb-2">
                Email Verified!
              </h1>
              <p className="text-muted-foreground mb-6">
                Your email has been verified successfully. You can now sign in to your account.
              </p>
              <Button asChild className="w-full">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          )}

          {verificationState === 'error' && (
            <div className="text-center">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-foreground mb-2">
                Verification Failed
              </h1>
              <p className="text-muted-foreground mb-6">
                {errorMessage}
              </p>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Need a new verification link? Enter your email below:
                </p>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                />
                <Button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t">
                <Link
                  href="/login"
                  className="text-sm text-primary hover:underline"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}

          {verificationState === 'no-token' && (
            <div className="text-center">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-foreground mb-2">
                Check Your Email
              </h1>
              <p className="text-muted-foreground mb-6">
                We sent a verification link to your email address. Click the link to verify your account.
              </p>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the email? Enter your email to resend:
                </p>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                />
                <Button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t">
                <Link
                  href="/login"
                  className="text-sm text-primary hover:underline"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
