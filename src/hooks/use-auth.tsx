
'use client';

import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  Dispatch,
  SetStateAction,
} from 'react';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/types/user';
import { AnvilIcon } from '@/components/app-logo';

export interface AuthContextType {
  authUser: User | null;
  userProfile: UserProfile | null;
  setUserProfile: Dispatch<SetStateAction<UserProfile | null>>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  authUser: null,
  userProfile: null,
  setUserProfile: () => {},
  loading: true,
});

async function getUserProfileFromDb(user: User): Promise<UserProfile | null> {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return null;
    
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching user profile:", error);
        return null;
    }

    if (data) {
        return {
            uid: user.id,
            email: user.email || null,
            displayName: data.display_name || user.email,
            photoURL: data.photo_url || null,
            role: data.role || 'user',
            emailVerified: user.email_confirmed_at ? true : false,
            isAnonymous: user.is_anonymous,
            metadata: user.user_metadata,
            providerData: [],
            stats: data.stats || {},
            preferences: data.preferences || {},
            profile: data.profile || {},
        } as UserProfile;
    }
    return null;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const fetchSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setAuthUser(currentUser);
        
        if (currentUser) {
            const profile = await getUserProfileFromDb(currentUser);
            setUserProfile(profile);
        } else {
            setUserProfile(null);
        }
        setLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        const currentUser = session?.user ?? null;
        setAuthUser(currentUser);

        if (currentUser) {
            const profile = await getUserProfileFromDb(currentUser);
            setUserProfile(profile);
        } else {
            setUserProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-background">
         <AnvilIcon className="w-24 h-24 animate-pulse-glow" />
         <p className="mt-4 text-muted-foreground font-headline tracking-wider animate-subtle-pulse">FORGING SESSION...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ authUser, userProfile, setUserProfile, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
