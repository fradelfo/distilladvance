'use client';

/**
 * Client-side Providers
 *
 * Wraps the application with necessary context providers
 * for authentication, tRPC, React Query, analytics, and other client-side state.
 */

import { useState, useEffect } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, createTRPCClient } from './trpc';
import { initAnalytics, identifyUser, resetUser } from './analytics';

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
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [trpcClient] = useState(() => createTRPCClient());

  return (
    <SessionProvider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AnalyticsProvider>{children}</AnalyticsProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </SessionProvider>
  );
}
