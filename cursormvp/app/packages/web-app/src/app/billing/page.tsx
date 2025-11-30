import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { BillingContent } from './BillingContent';

export default async function BillingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return <BillingContent />;
}
