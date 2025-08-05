
import { redirect } from 'next/navigation';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { adminApp, adminDb } from '@/lib/firebase/server';
import { getDashboardStats } from './actions';
import { DashboardClient } from './dashboard-client';

async function getIsAdmin(): Promise<boolean> {
  const cookieStore = cookies();
  const idToken = cookieStore.get('firebaseIdToken')?.value;

  if (!idToken || !adminApp || !adminDb) {
    return false;
  }

  try {
    const auth = getAuth(adminApp);
    const decodedToken = await auth.verifyIdToken(idToken);
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    
    return userDoc.exists && userDoc.data()?.role === 'admin';
  } catch (error: unknown) {
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
