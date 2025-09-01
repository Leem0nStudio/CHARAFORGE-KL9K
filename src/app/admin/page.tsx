
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase/server';
import { cookies } from 'next/headers';
import { getDashboardStats } from '@/app/actions/admin';
import { DashboardClient } from './dashboard-client';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';

async function getIsAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const idToken = cookieStore.get('firebaseIdToken')?.value;

    if (!idToken) {
      // No cookie, definitely not logged in or an admin.
      return false;
    }
    
    if (!adminAuth) {
      console.error("Admin check failed: Firebase Admin SDK is not initialized.");
      return false;
    }
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken.admin === true;

  } catch (error: any) {
    // If the token is invalid, expired, or verification fails, they are not an admin.
    // This also handles cases where the cookie is present but malformed.
    // Differentiate between "not an admin" and "session expired".
    if (error.code === 'auth/id-token-expired') {
        // This is a specific error we can handle gracefully by redirecting to login.
        redirect('/login?reason=session-expired&redirect=/admin');
    }
    
    // For other errors, log it and treat as "not an admin".
    console.warn("Admin check failed (user is not an admin or token is invalid):", error.message);
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
