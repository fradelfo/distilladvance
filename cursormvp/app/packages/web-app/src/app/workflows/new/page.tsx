import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { WorkflowBuilderContent } from './WorkflowBuilderContent';
import { AppLayout } from '@/components/AppLayout';

export const metadata = {
  title: 'Create Workflow',
  description: 'Create a new prompt workflow',
};

export default async function NewWorkflowPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <AppLayout user={session.user} currentPage="workflows">
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <WorkflowBuilderContent mode="create" />
      </div>
    </AppLayout>
  );
}
