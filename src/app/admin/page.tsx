
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase/server';
import { cookies } from 'next/headers';
import { getDashboardStats } from './actions';
import { DashboardClient } from './dashboard-client';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';

async function getIsAdmin(): Promise<boolean> {
  const cookieStore = cookies();
  const idToken = cookieStore.get('firebaseIdToken')?.value;

  // If there's no token, the user is not authenticated and cannot be an admin.
  if (!idToken) {
    return false;
  }
  
  // If the adminAuth isn't initialized, something is wrong with the server setup.
  if (!adminAuth) {
    console.error("Firebase Admin Auth service not initialized on the server.");
    return false;
  }

  try {
    // Verifying the token decodes it and gives access to custom claims.
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    // The 'admin' property is a custom claim we set.
    // We check for `=== true` for a strict boolean check. It's a valid sign-in, just not an admin.
    return decodedToken.admin === true;
  } catch (error) {
    // This catches errors like an expired or truly invalid token.
    // A user without the admin claim is not an error, so we don't log it here.
    console.error("Admin check failed due to token verification error:", error);
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
