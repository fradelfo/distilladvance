import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { CollectionsContent } from './CollectionsContent';
import { AppLayout } from '@/components/AppLayout';

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
    <AppLayout user={session.user} currentPage="collections">
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <CollectionsContent />
      </div>
    </AppLayout>
  );
}
