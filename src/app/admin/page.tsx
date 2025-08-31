
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getDashboardStats } from '@/app/actions/admin';
import { DashboardClient } from './dashboard-client';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';

async function getIsAdmin(): Promise<boolean> {
  try {
    const supabase = getSupabaseServerClient();
    
    // Get the current user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      // No user, definitely not logged in or an admin.
      return false;
    }
    
    // Check if the user has admin role in the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (userError || !userData) {
      console.warn("Admin check failed: Could not fetch user data");
      return false;
    }
    
    return userData.role === 'admin';

  } catch (error: any) {
    // For any errors, log it and treat as "not an admin".
    console.warn("Admin check failed:", error.message);
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
