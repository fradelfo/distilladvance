import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/lib/providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Distill - Turn AI Chats into Reusable Prompts',
    template: '%s | Distill',
  },
  description: 'Capture your AI conversations and distill them into reusable, team-ready prompt templates with built-in coaching and privacy controls.',
  keywords: ['AI prompts', 'ChatGPT', 'Claude', 'prompt management', 'team prompts'],
  authors: [{ name: 'Distill' }],
  creator: 'Distill',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://distill.ai',
    siteName: 'Distill',
    title: 'Distill - Turn AI Chats into Reusable Prompts',
    description: 'Capture your AI conversations and distill them into reusable, team-ready prompt templates.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Distill - Turn AI Chats into Reusable Prompts',
    description: 'Capture your AI conversations and distill them into reusable, team-ready prompt templates.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} h-full`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
