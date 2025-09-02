
'use server';

import { Suspense } from 'react';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { Loader2 } from 'lucide-react';

interface EditDataPackPageProps {
  params: { id: string };
}

// This component now only sets up the layout and suspense boundary.
export default async function EditDataPackPage({ params }: EditDataPackPageProps) {
  const { id } = params;
  const isNew = id === 'new';
  const title = isNew ? 'Create DataPack' : `Edit DataPack`;

  return (
    <AdminPageLayout title={title}>
        <Suspense fallback={
            <div className="flex justify-center items-center p-16">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            {/* The form will be loaded via the edit/page.tsx route */}
        </Suspense>
    </AdminPageLayout>
  );
}
