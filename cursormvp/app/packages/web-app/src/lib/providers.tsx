'use client';

/**
 * Client-side Providers
 *
 * Wraps the application with necessary context providers
 * for authentication, tRPC, React Query, analytics, theme, and other client-side state.
 */

import { useState, useEffect } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, createTRPCClient } from './trpc';
import { initAnalytics, identifyUser, resetUser } from './analytics';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { WebVitals } from '@/components/WebVitals';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Analytics provider that handles initialization and user identification.
 */
function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  // Initialize analytics on mount
  useEffect(() => {
    initAnalytics();
  }, []);

  // Identify user when session changes
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      identifyUser(session.user.id || session.user.email || 'anonymous', {
        email: session.user.email,
        name: session.user.name,
      });
    } else if (status === 'unauthenticated') {
      resetUser();
    }
  }, [session, status]);

  return <>{children}</>;
}

export function Providers({ children }: ProvidersProps) {
  // Create stable instances that persist across renders
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data stays fresh for 5 minutes before becoming stale
            staleTime: 5 * 60 * 1000,
            // Keep unused data in cache for 30 minutes before garbage collection
            gcTime: 30 * 60 * 1000,
            // Don't refetch on window focus (user triggered only)
            refetchOnWindowFocus: false,
            // Don't refetch when component remounts if data is fresh
            refetchOnMount: false,
            // Retry failed requests 2 times with exponential backoff
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
          },
          mutations: {
            // Retry mutations once on network errors
            retry: 1,
          },
        },
      })
  );

  const [trpcClient] = useState(() => createTRPCClient());

  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <AnalyticsProvider>{children}</AnalyticsProvider>
              <WebVitals />
              <Toaster />
            </TooltipProvider>
          </QueryClientProvider>
        </trpc.Provider>
      </ThemeProvider>
    </SessionProvider>
  );
}
