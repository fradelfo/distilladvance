import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { CollectionDetailContent } from './CollectionDetailContent';

interface CollectionDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CollectionDetailPageProps) {
  const { id } = await params;
  return {
    title: `Collection - Distill`,
    description: `View and manage collection ${id}`,
  };
}

export default async function CollectionDetailPage({
  params,
}: CollectionDetailPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader user={session.user} currentPage="collections" />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CollectionDetailContent collectionId={id} />
      </main>
    </div>
  );
}
