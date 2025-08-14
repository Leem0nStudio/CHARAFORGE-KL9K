
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase/server';
import { cookies } from 'next/headers';
import { getDashboardStats } from '@/app/actions/admin';
import { DashboardClient } from './dashboard-client';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';

async function getIsAdmin(): Promise<boolean> {
  try {
    const cookieStore = cookies();
    const idToken = cookieStore.get('firebaseIdToken')?.value;

    if (!idToken || !adminAuth) {
      return false;
    }
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken.admin === true;

  } catch (error) {
    // If the token is invalid, expired, or verification fails, they are not an admin.
    // This also handles cases where the cookie is present but malformed.
    console.warn("Admin check failed (user is not an admin or token is invalid):", error instanceof Error ? error.message : "Unknown error");
    return false;
  }
}

export default async function AdminDashboardPage() {
  const isAdmin = await getIsAdmin();
  
  if (!isAdmin) {
    redirect('/');
  }
  
  const stats = await getDashboardStats();

  return (
    <AdminPageLayout title="Dashboard">
        <DashboardClient stats={stats} />
    </AdminPageLayout>
  )
}
