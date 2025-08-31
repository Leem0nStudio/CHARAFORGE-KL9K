'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { DataPackDetailClient } from './client';
import { useParams } from 'next/navigation';

export default function DatapackDetailPage() {
  const params = useParams();
  // Ensure id is a string, as useParams can return string | string[]
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Invalid DataPack ID.</p>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <DataPackDetailClient packId={id} />
    </Suspense>
  );
}
