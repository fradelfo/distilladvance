import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { PromptEditContent } from './PromptEditContent';

interface PromptEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Edit Prompt',
  description: 'Edit your prompt template',
};

export default async function PromptEditPage({ params }: PromptEditPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader user={session.user} currentPage="prompts" />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <PromptEditContent promptId={id} />
      </main>
    </div>
  );
}
