import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ConversationsContent } from './ConversationsContent';
import { AppLayout } from '@/components/AppLayout';

export const metadata = {
  title: 'Conversations',
  description: 'Browse and manage your captured AI conversations',
};

export default async function ConversationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <AppLayout user={session.user} currentPage="conversations">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ConversationsContent />
      </div>
    </AppLayout>
  );
}
