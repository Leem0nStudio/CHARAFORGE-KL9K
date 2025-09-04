import { Suspense } from 'react';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

// This component now only sets up the layout and suspense boundary.
// It has been simplified to match the expected signature for a Next.js layout.
export default function EditDataPackLayout({ children }: { children: ReactNode }) {
  // The title is now managed by the child page component to avoid complexity here.
  return (
    <AdminPageLayout title="DataPack Editor">
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
