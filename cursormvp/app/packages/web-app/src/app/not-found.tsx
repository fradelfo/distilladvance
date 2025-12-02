import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-muted-foreground">Page not found</p>
        <Link href="/" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
          Go back home
        </Link>
      </div>
    </div>
  );
}
