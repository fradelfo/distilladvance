import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { PromptDetailContent } from './PromptDetailContent';

interface PromptDetailPageProps {
  params: {
    id: string;
  };
  searchParams: {
    run?: string;
  };
}

export const metadata = {
  title: 'Prompt Details',
  description: 'View and manage your prompt template',
};

export default async function PromptDetailPage({
  params,
  searchParams,
}: PromptDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const isRunMode = searchParams.run === 'true';

  return (
    <AppLayout user={session.user} currentPage="prompts">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <PromptDetailContent promptId={params.id} initialRunMode={isRunMode} />
      </div>
    </AppLayout>
  );
}
