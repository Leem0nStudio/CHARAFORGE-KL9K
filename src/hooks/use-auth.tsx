
'use client';

import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from 'react';
import { User, onIdTokenChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { Skeleton } from '@/components/ui/skeleton';

export interface UserProfile extends User {
  stats?: UserStats;
  role?: 'admin' | 'moderator' | 'user';
}

export interface UserStats {
  charactersCreated: number;
  totalLikes: number;
  collectionsCreated: number;
  installedPacks: string[];
  subscriptionTier: string;
  memberSince: any; 
}


export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

async function setCookie(token: string | null): Promise<void> {
  console.log('[useAuth] Setting cookie with token:', token ? 'Token Present' : 'Token Null');
  // This promise will resolve when the fetch call is complete.
  await fetch('/api/auth/set-cookie', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
   console.log('[useAuth] Cookie fetch completed.');
}

const ensureUserDocument = async (user: User): Promise<DocumentData | null> => {
  if (!db) {
     console.error("[useAuth] Firestore (db) is not available in ensureUserDocument.");
     return null;
  }
  console.log(`[useAuth] Ensuring user document for ${user.uid}...`);
  const userDocRef = doc(db, 'users', user.uid);
  try {
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      console.log(`[useAuth] No document found for ${user.uid}. Creating one...`);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        role: 'user',
        stats: {
          charactersCreated: 0,
          totalLikes: 0,
          collectionsCreated: 0,
          installedPacks: ['core_base_styles'],
          subscriptionTier: 'free',
          memberSince: serverTimestamp(),
        }
      });
    } else {
        console.log(`[useAuth] Document found for ${user.uid}. Checking for updates...`);
        const updateData: { displayName: string | null; photoURL: string | null; email?: string | null } = {
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        if (user.email !== userDoc.data()?.email) {
            updateData.email = user.email;
        }
        await updateDoc(userDocRef, updateData);
    }
    
    const updatedUserDoc = await getDoc(userDocRef);
    const firestoreData = updatedUserDoc.data() || null;
    console.log('[useAuth] User document ensured:', firestoreData);
    return firestoreData;

  } catch (error: unknown) {
    console.error(`[useAuth] Error in ensureUserDocument for ${user.uid}:`, error);
    return null;
  }
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
        console.error("[useAuth] Firebase Auth is not available. AuthProvider cannot subscribe to token changes.");
        setLoading(false);
        return;
    }
    console.log('[useAuth] Subscribing to onIdTokenChanged...');
    const unsubscribe = onIdTokenChanged(auth, async (authUser) => {
      console.log('[useAuth] onIdTokenChanged fired. Auth user:', authUser ? authUser.uid : null);
      if (authUser) {
        setLoading(true);
        const token = await authUser.getIdToken();
        
        // This is the fix: The cookie MUST be set and awaited before any other action.
        await setCookie(token);

        // This now runs only after the server session is confirmed.
        const firestoreData = await ensureUserDocument(authUser);
        
        const userProfile: UserProfile = {
            ...authUser,
            ...firestoreData,
            role: firestoreData?.role || 'user',
        }
        console.log('[useAuth] Setting user profile:', userProfile);
        setUser(userProfile);

      } else {
        console.log('[useAuth] No auth user. Clearing cookie and user profile.');
        await setCookie(null);
        setUser(null);
      }
      setLoading(false);
      console.log('[useAuth] Auth state processing finished.');
    });

    return () => {
      console.log('[useAuth] Unsubscribing from onIdTokenChanged.');
      unsubscribe();
    }
    
  }, []);

  if (loading && !user) { // Only show the global skeleton on initial load
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-full max-w-md p-8 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
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
