import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { OnboardingContent } from './OnboardingContent';

export const metadata = {
  title: 'Welcome to Distill',
  description: 'Set up your Distill account and start capturing AI prompts',
};

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return <OnboardingContent user={session.user} />;
}
