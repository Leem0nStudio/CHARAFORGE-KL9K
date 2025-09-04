
'use server';

import { Suspense } from 'react';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

// This component now only sets up the layout and suspense boundary.
// The problematic interface has been removed and props are typed inline.
export default async function EditDataPackLayout({
  params,
  children,
}: {
  params: { id: string };
  children: ReactNode;
}) {
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
            {children}
        </Suspense>
    </AdminPageLayout>
  );
}
