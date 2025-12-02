'use client';

/**
 * Client-side Providers
 *
 * Wraps the application with necessary context providers
 * for authentication, tRPC, React Query, analytics, theme, and other client-side state.
 */

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider, useSession } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';
import { identifyUser, initAnalytics, resetUser } from './analytics';
import { createTRPCClient, trpc } from './trpc';

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
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <AnalyticsProvider>{children}</AnalyticsProvider>
              <Toaster />
            </TooltipProvider>
          </QueryClientProvider>
        </trpc.Provider>
      </ThemeProvider>
    </SessionProvider>
  );
}
