
import { redirect } from 'next/navigation';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { adminApp } from '@/lib/firebase/server';
import { getDashboardStats } from './actions';
import { DashboardClient } from './dashboard-client';

async function getIsAdmin(): Promise<boolean> {
  const cookieStore = cookies();
  const idToken = cookieStore.get('firebaseIdToken')?.value;

  // If there's no token, the user is not authenticated and cannot be an admin.
  if (!idToken) {
    return false;
  }
  
  // If the adminApp isn't initialized, something is wrong with the server setup.
  if (!adminApp) {
    console.error("Firebase Admin App not initialized on the server.");
    return false;
  }

  try {
    const auth = getAuth(adminApp);
    // Verifying the token decodes it and gives access to custom claims.
    const decodedToken = await auth.verifyIdToken(idToken);
    // The 'admin' property is a custom claim we set.
    // We check for `=== true` for a strict boolean check.
    return decodedToken.admin === true;
  } catch (error) {
    // This catches errors like an expired or invalid token.
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

  return <DashboardClient stats={stats} />;
}
