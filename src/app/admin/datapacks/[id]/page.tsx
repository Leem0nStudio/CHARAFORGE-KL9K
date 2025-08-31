
'use server';

import { Suspense } from 'react';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { EditDataPackForm } from './edit-datapack-form';
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
            <EditDataPackForm packId={id} />
        </Suspense>
    </AdminPageLayout>
  );
}
