import { auth } from '@/auth';
import { AppLayout } from '@/components/AppLayout';
import { redirect } from 'next/navigation';
import { ExecutionHistoryContent } from './ExecutionHistoryContent';

export const metadata = {
  title: 'Execution History',
  description: 'View workflow execution history',
};

interface ExecutionHistoryPageProps {
  params: { id: string };
}

export default async function ExecutionHistoryPage({ params }: ExecutionHistoryPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <AppLayout user={session.user} currentPage="workflows">
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <ExecutionHistoryContent workflowId={params.id} />
      </div>
    </AppLayout>
  );
}
