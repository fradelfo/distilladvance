import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { NewPromptContent } from './NewPromptContent';

export const metadata = {
  title: 'Create New Prompt',
  description: 'Create a new prompt template',
};

export default async function NewPromptPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <AppLayout user={session.user} currentPage="prompts">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <NewPromptContent />
      </div>
    </AppLayout>
  );
}
