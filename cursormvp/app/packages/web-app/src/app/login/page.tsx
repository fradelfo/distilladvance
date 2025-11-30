'use client';

import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');
  const registered = searchParams.get('registered') === 'true';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('root', { message: 'Invalid email or password' });
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('root', { message: 'Something went wrong. Please try again.' });
    }
  };

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">💧</span>
            <span className="text-2xl font-semibold text-neutral-900">Distill</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-neutral-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Sign in to your account to continue
          </p>
        </div>

        {/* Success Message */}
        {registered && (
          <div className="mb-4 rounded-md bg-success-50 p-4">
            <p className="text-sm text-success-600">
              Account created successfully! Please sign in with your credentials.
            </p>
          </div>
        )}

        {/* Error Messages */}
        {(error || errors.root) && (
          <div className="mb-4 rounded-md bg-error-50 p-4">
            <p className="text-sm text-error-600">
              {error === 'OAuthAccountNotLinked'
                ? 'This email is already associated with another account.'
                : errors.root?.message || 'An error occurred. Please try again.'}
            </p>
          </div>
        )}

        {/* Login Form */}
        <div className="card p-6">
          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full h-12"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-neutral-200" />
            <span className="px-4 text-sm text-neutral-500">or</span>
            <div className="flex-1 border-t border-neutral-200" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={cn(errors.email && 'border-destructive')}
                placeholder="you@example.com"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className={cn(errors.password && 'border-destructive')}
                placeholder="••••••••"
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>

        {/* Sign Up Link */}
        <p className="mt-6 text-center text-sm text-neutral-600">
          Don't have an account?{' '}
          <Link
            href="/signup"
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Sign up for free
          </Link>
        </p>

        {/* Dev Notice */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 rounded-md bg-neutral-100 p-3 text-center text-xs text-neutral-600">
            <p className="font-medium">Development Mode</p>
            <p>Create an account via the sign up page</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LoginFormFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  );
}
