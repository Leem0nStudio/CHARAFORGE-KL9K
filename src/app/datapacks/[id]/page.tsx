
'use server';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { DataPackDetailClient } from './client';
import type { AsyncParams } from '@/types/next';

/**
 * This is the server-side page component for displaying a single DataPack.
 * It follows the modern Next.js 15 App Router pattern for dynamic segments.
 * 
 * 1.  It's a Server Component (`'use server'` is implicitly true).
 * 2.  It uses the `AsyncParams` helper type for correct `params` typing.
 * 3.  It `await`s the `params` promise to get the `id`.
 * 4.  It passes the `id` to a Client Component (`DataPackDetailClient`) which handles data fetching and presentation.
 * 5.  It wraps the client component in a `Suspense` boundary to show a loading state.
 */
export default async function DatapackDetailPage({ params }: AsyncParams<{ id: string }>) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <DataPackDetailClient packId={id} />
    </Suspense>
  );
}
