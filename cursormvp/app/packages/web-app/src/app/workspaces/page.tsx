import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { WorkspacesContent } from './WorkspacesContent';
import { AppLayout } from '@/components/AppLayout';

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
    <AppLayout user={session.user} currentPage="workspaces">
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <WorkspacesContent />
      </div>
    </AppLayout>
  );
}
