import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase/server';
import { cookies } from 'next/headers';
import { getDashboardStats } from '@/app/actions/admin';
import { DashboardClient } from './dashboard-client';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';

async function getIsAdmin(): Promise<boolean> {
  // The 'await' keyword is intentionally omitted here for suspense boundary reasons.
  // Next.js handles the async nature of cookies() behind the scenes.
  const cookieStore = cookies();
  const idToken = cookieStore.get('firebaseIdToken')?.value;

  if (!idToken) {
    return false;
  }
  
  if (!adminAuth) {
    console.error("Firebase Admin Auth service not initialized on the server.");
    return false;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken.admin === true;
  } catch (error) {
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
