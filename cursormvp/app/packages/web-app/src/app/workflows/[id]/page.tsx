import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { WorkflowDetailContent } from './WorkflowDetailContent';
import { AppLayout } from '@/components/AppLayout';

export const metadata = {
  title: 'Workflow',
  description: 'View and run workflow',
};

interface WorkflowDetailPageProps {
  params: { id: string };
}

export default async function WorkflowDetailPage({ params }: WorkflowDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <AppLayout user={session.user} currentPage="workflows">
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <WorkflowDetailContent workflowId={params.id} />
      </div>
    </AppLayout>
  );
}
