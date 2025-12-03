import { auth } from '@/auth';
import { AppLayout } from '@/components/AppLayout';
import { redirect } from 'next/navigation';
import { ExecutionDetailContent } from './ExecutionDetailContent';

export const metadata = {
  title: 'Execution Details',
  description: 'View workflow execution details',
};

interface ExecutionDetailPageProps {
  params: { id: string; execId: string };
}

export default async function ExecutionDetailPage({ params }: ExecutionDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <AppLayout user={session.user} currentPage="workflows">
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <ExecutionDetailContent workflowId={params.id} executionId={params.execId} />
      </div>
    </AppLayout>
  );
}
