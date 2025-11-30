import { auth } from '@/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { HomeContent } from './HomeContent';

export const metadata = {
  title: 'Home',
  description: 'Your Distill home page',
};

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <AppLayout user={session.user} currentPage="home">
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Home</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome back, {session.user.name || 'User'}
            </p>
          </div>
          <Link href="/prompts/new" className="btn-primary px-4 py-2">
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Prompt
            </span>
          </Link>
        </div>

        {/* Dynamic Content */}
        <HomeContent userName={session.user.name || undefined} />
      </div>
    </AppLayout>
  );
}
