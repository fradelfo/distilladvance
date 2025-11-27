import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { PromptLibraryContent } from './PromptLibraryContent';
import { AppHeader } from '@/components/AppHeader';

export const metadata = {
  title: 'Prompt Library',
  description: 'Browse and manage your prompt templates',
};

export default async function PromptsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader user={session.user} currentPage="prompts" />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PromptLibraryContent />
      </main>
    </div>
  );
}
