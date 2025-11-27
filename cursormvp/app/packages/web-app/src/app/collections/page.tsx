import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { CollectionsContent } from './CollectionsContent';
import { AppHeader } from '@/components/AppHeader';

export const metadata = {
  title: 'Collections',
  description: 'Organize your prompts into collections',
};

export default async function CollectionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader user={session.user} currentPage="collections" />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CollectionsContent />
      </main>
    </div>
  );
}
