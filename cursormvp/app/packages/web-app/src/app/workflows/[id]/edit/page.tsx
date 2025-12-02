import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { WorkflowBuilderContent } from '../../new/WorkflowBuilderContent';
import { AppLayout } from '@/components/AppLayout';

export const metadata = {
  title: 'Edit Workflow',
  description: 'Edit your workflow',
};

interface EditWorkflowPageProps {
  params: { id: string };
}

export default async function EditWorkflowPage({ params }: EditWorkflowPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <AppLayout user={session.user} currentPage="workflows">
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <WorkflowBuilderContent mode="edit" workflowId={params.id} />
      </div>
    </AppLayout>
  );
}
