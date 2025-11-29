import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { ConversationDetailContent } from './ConversationDetailContent';

interface ConversationDetailPageProps {
  params: {
    id: string;
  };
}

export const metadata = {
  title: 'Conversation Details',
  description: 'View and manage your captured conversation',
};

export default async function ConversationDetailPage({
  params,
}: ConversationDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader user={session.user} currentPage="conversations" />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <ConversationDetailContent conversationId={params.id} />
      </main>
    </div>
  );
}
