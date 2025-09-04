'use server';

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client for database operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Service Role Key is not set in environment variables.');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);


const grantAdminRole = async (uid: string) => {
  try {
    const { error } = await supabase.from('users').update({ role: 'admin' }).eq('id', uid);
    if (error) throw error;
    console.log(`Success! User ${uid} has been granted the admin role.`);
  } catch (error: any) {
    console.error(`Error granting admin role to ${uid}:`, error.message);
  }
};

const revokeAdminRole = async (uid: string) => {
  try {
    const { error } = await supabase.from('users').update({ role: 'user' }).eq('id', uid);
    if (error) throw error;
    console.log(`Success! Admin role has been revoked for user ${uid}.`);
  } catch (error: any) {
    console.error(`Error revoking admin role for ${uid}:`, error.message);
  }
};

const checkAdminStatus = async (uid: string) => {
  try {
    const { data: user, error } = await supabase.from('users').select('id, email, role').eq('id', uid).single();
    if (error) throw error;
    
    const isAdmin = user.role === 'admin';
    console.log(`User ${user.id} (${user.email || 'No Email'}) has admin status: ${isAdmin}`);
  } catch (error: any) {
    console.error(`Error checking admin status for ${uid}:`, error.message);
  }
};

const listAdmins = async () => {
  console.log('Fetching list of admins...');
  try {
    const { data: admins, error } = await supabase
      .from('users')
      .select('id, email, display_name')
      .eq('role', 'admin');
    
    if (error) throw error;

    if (admins.length === 0) {
      console.log('No admin users found.');
    } else {
      console.log('Admin Users:');
      console.table(admins);
    }
  } catch (error: any) {
    console.error('Error listing admin users:', error.message);
  }
};

const main = async () => {
  const [command, uid] = process.argv.slice(2);

  switch (command) {
    case 'grant':
      if (!uid) {
        console.error('Error: Please provide a UID to grant admin role.');
        process.exit(1);
      }
      await grantAdminRole(uid);
      break;

    case 'revoke':
      if (!uid) {
        console.error('Error: Please provide a UID to revoke admin role.');
        process.exit(1);
      }
      await revokeAdminRole(uid);
      break;

    case 'check':
      if (!uid) {
        console.error('Error: Please provide a UID to check admin status.');
        process.exit(1);
      }
      await checkAdminStatus(uid);
      break;

    case 'list':
      await listAdmins();
      break;

    default:
      console.log('Invalid command. Available commands:');
      console.log('  grant <uid>     - Grants admin role to a user');
      console.log('  revoke <uid>    - Revokes admin role from a user');
      console.log('  check <uid>     - Checks if a user is an admin');
      console.log('  list            - Lists all admin users');
      break;
  }
  process.exit(0);
};

main();
