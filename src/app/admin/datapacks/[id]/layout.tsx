
'use server';

import { Suspense } from 'react';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { Loader2 } from 'lucide-react';

interface EditDataPackLayoutProps {
  params: { id: string };
  children: React.ReactNode;
}

// This component now only sets up the layout and suspense boundary.
export default async function EditDataPackLayout({ params, children }: EditDataPackLayoutProps) {
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
