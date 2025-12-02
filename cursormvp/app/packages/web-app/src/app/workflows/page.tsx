import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { WorkflowsContent } from './WorkflowsContent';
import { AppLayout } from '@/components/AppLayout';

export const metadata = {
  title: 'Workflows',
  description: 'Create and manage prompt workflows',
};

export default async function WorkflowsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <AppLayout user={session.user} currentPage="workflows">
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <WorkflowsContent />
      </div>
    </AppLayout>
  );
}
