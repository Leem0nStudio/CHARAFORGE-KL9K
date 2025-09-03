
'use server';

import { redirect } from 'next/navigation';
import { verifyIsAdmin } from '@/lib/auth/server';
import { getDashboardStats } from '@/app/actions/admin';
import { DashboardClient } from './dashboard-client';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';

export default async function AdminDashboardPage() {
  try {
    await verifyIsAdmin();
  } catch {
    redirect('/login?reason=unauthenticated'); 
  }

  // If we reach here, the user is a verified admin.
  const stats = await getDashboardStats();

  return (
    <AdminPageLayout title="Dashboard">
        <DashboardClient stats={stats} />
    </AdminPageLayout>
  );
}
