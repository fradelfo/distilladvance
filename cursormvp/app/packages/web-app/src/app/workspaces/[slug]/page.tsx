import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { WorkspaceDetailContent } from './WorkspaceDetailContent';

interface WorkspacePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: WorkspacePageProps) {
  const { slug } = await params;
  return {
    title: `Workspace - Distill`,
    description: `View workspace ${slug}`,
  };
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const session = await auth();
  const { slug } = await params;

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <AppLayout user={session.user} currentPage="workspaces">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <WorkspaceDetailContent workspaceSlug={slug} />
      </div>
    </AppLayout>
  );
}
