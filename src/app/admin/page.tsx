import { redirect } from 'next/navigation';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { admin, adminDb } from '@/lib/firebase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Swords, BarChart } from 'lucide-react';
import { getDashboardStats } from './actions';


async function getIsAdmin(): Promise<boolean> {
  const cookieStore = cookies();
  const idToken = cookieStore.get('firebaseIdToken')?.value;

  // If there's no token, or if the admin app isn't initialized, they can't be an admin.
  if (!idToken || !admin) {
    return false;
  }
  // If the database isn't available, we can't check the role claim.
  if (!adminDb) {
      return false;
  }

  try {
    const decodedToken = await getAuth(admin).verifyIdToken(idToken);
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    
    // Check for the 'admin' role in the user's document in Firestore.
    // This is more secure and flexible than relying only on custom claims.
    return userDoc.exists && userDoc.data()?.role === 'admin';
  } catch (error: unknown) {
    // Don't log the error in production for security reasons.
    // In a real app, this should go to a proper logging service.
    if (process.env.NODE_ENV !== 'production') {
        if (error instanceof Error) {
            console.error('Error verifying admin status:', error.message);
        } else {
            console.error('An unknown error occurred while verifying admin status');
        }
    }
    return false;
  }
}

export default async function AdminDashboardPage() {
  const isAdmin = await getIsAdmin();
  
  if (!isAdmin) {
    redirect('/'); // Or to a dedicated "unauthorized" page
  }
  
  const stats = await getDashboardStats();

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl font-headline tracking-wider">Admin Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Total registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Characters</CardTitle>
            <Swords className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCharacters}</div>
             <p className="text-xs text-muted-foreground">
                {stats.publicCharacters} public / {stats.privateCharacters} private
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Status</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Operational</div>
             <p className="text-xs text-muted-foreground">Public API is running</p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Analytics (Coming Soon)</h2>
         <Card className="min-h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Charts and more detailed analytics will be displayed here.</p>
        </Card>
      </div>
    </main>
  );
}
