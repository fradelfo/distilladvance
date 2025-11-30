import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AnalyticsDashboard } from './AnalyticsDashboard';

export const metadata = {
  title: 'Analytics',
  description: 'View your Distill usage analytics and metrics',
};

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <a href="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl">💧</span>
              <span className="text-xl font-semibold text-foreground">Distill</span>
            </a>
            <nav className="hidden md:flex md:gap-4">
              <a href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Dashboard
              </a>
              <a href="/prompts" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Library
              </a>
              <a href="/workspaces" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Workspaces
              </a>
              <a href="/analytics" className="text-sm font-medium text-primary-600">
                Analytics
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your team's prompt usage, activation, and engagement metrics.
          </p>
        </div>

        <AnalyticsDashboard />
      </main>
    </div>
  );
}
