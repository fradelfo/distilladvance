import { AppSidebar } from './AppSidebar';

interface AppLayoutProps {
  user: {
    id: string;
    email: string;
    name: string;
    image: string | null;
  };
  currentPage?: 'home' | 'prompts' | 'conversations' | 'collections' | 'workspaces' | 'settings';
  children: React.ReactNode;
}

export function AppLayout({ user, currentPage, children }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar user={user} currentPage={currentPage} />
      <main className="flex-1 overflow-auto bg-muted/50">
        {children}
      </main>
    </div>
  );
}
