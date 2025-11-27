import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💧</span>
            <span className="text-xl font-semibold text-neutral-900">Distill</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="btn-primary px-4 py-2 text-sm"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
            Turn AI Chats into
            <span className="text-primary-600"> Reusable Prompts</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-neutral-600">
            Capture your best AI conversations and distill them into team-ready prompt
            templates. With built-in coaching and privacy controls, Distill helps your
            team work smarter with AI.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="btn-primary w-full px-8 py-3 text-base sm:w-auto"
            >
              Start for Free
            </Link>
            <Link
              href="#features"
              className="btn-outline w-full px-8 py-3 text-base sm:w-auto"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="mx-auto mt-24 max-w-5xl">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="card p-6">
              <div className="mb-4 text-3xl">📸</div>
              <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                Capture in One Click
              </h3>
              <p className="text-sm text-neutral-600">
                Our browser extension captures conversations from ChatGPT, Claude,
                Gemini, and more with a single click.
              </p>
            </div>
            <div className="card p-6">
              <div className="mb-4 text-3xl">✨</div>
              <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                Auto-Distill Templates
              </h3>
              <p className="text-sm text-neutral-600">
                AI automatically extracts reusable prompt templates with variables,
                tags, and examples.
              </p>
            </div>
            <div className="card p-6">
              <div className="mb-4 text-3xl">👥</div>
              <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                Team Sharing
              </h3>
              <p className="text-sm text-neutral-600">
                Share prompts across your workspace with privacy controls. Build a
                team prompt playbook.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-lg">💧</span>
              <span className="text-sm text-neutral-600">
                © 2024 Distill. All rights reserved.
              </span>
            </div>
            <nav className="flex gap-6">
              <Link
                href="/privacy"
                className="text-sm text-neutral-600 hover:text-neutral-900"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-neutral-600 hover:text-neutral-900"
              >
                Terms
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
