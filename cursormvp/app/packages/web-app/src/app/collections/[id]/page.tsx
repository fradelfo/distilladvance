import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
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
    <AppLayout user={session.user} currentPage="collections">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CollectionDetailContent collectionId={id} />
      </div>
    </AppLayout>
  );
}
