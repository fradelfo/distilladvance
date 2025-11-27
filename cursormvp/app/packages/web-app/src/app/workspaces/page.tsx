import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { WorkspacesContent } from './WorkspacesContent';
import { AppHeader } from '@/components/AppHeader';

export const metadata = {
  title: 'Workspaces - Distill',
  description: 'Manage your team workspaces',
};

export default async function WorkspacesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader user={session.user} currentPage="workspaces" />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <WorkspacesContent />
      </main>
    </div>
  );
}
