import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { PromptLibraryContent } from './PromptLibraryContent';
import { AppLayout } from '@/components/AppLayout';

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
    <AppLayout user={session.user} currentPage="prompts">
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <PromptLibraryContent />
      </div>
    </AppLayout>
  );
}
