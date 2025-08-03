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
  console.log('[useAuth] setCookie called. Token:', token ? 'Present' : 'null');
  try {
    // Return the promise from fetch
    await fetch('/api/auth/set-cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
     console.log('[useAuth] setCookie request sent successfully.');
  } catch (error: unknown) {
    console.error('[useAuth] Error setting cookie:', error);
    // Even if it fails, we resolve the promise so the app can continue.
    // The server-side logic will just not find the user authenticated.
  }
}

const ensureUserDocument = async (user: User): Promise<DocumentData | null> => {
   console.log(`[useAuth] ensureUserDocument for user: ${user.uid}`);
  if (!db) {
    console.error('[useAuth] Firestore (db) is not available in ensureUserDocument.');
    return null; 
  }
  const userDocRef = doc(db, 'users', user.uid);
  try {
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      console.log(`[useAuth] No document found for user ${user.uid}, creating new one.`);
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
      console.log(`[useAuth] User document for ${user.uid} created.`);
    } else {
        console.log(`[useAuth] Document found for user ${user.uid}, checking for updates.`);
        const updateData: { displayName: string | null; photoURL: string | null; email?: string | null } = {
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        if (user.email !== userDoc.data()?.email) {
            updateData.email = user.email;
        }
        await updateDoc(userDocRef, updateData);
        console.log(`[useAuth] User document for ${user.uid} updated.`);
    }
    
    const updatedUserDoc = await getDoc(userDocRef);
    const firestoreData = updatedUserDoc.data() || null;
    console.log(`[useAuth] Returning firestore data for ${user.uid}:`, firestoreData);
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
    console.log('[useAuth] AuthProvider mounted. Setting up onIdTokenChanged listener.');
    if (!auth) {
        console.error("[useAuth] Firebase Auth is not available. Cannot set up listener.");
        setLoading(false);
        return;
    }
    const unsubscribe = onIdTokenChanged(auth, async (authUser) => {
      console.log('[useAuth] onIdTokenChanged fired.');
      if (authUser) {
        console.log(`[useAuth] User detected (UID: ${authUser.uid}).`);
        setLoading(true); // Set loading while we process the token and user doc
        const token = await authUser.getIdToken();
        console.log('[useAuth] Got ID token from Firebase.');
        
        // Wait for the cookie to be set before proceeding
        await setCookie(token);

        const firestoreData = await ensureUserDocument(authUser);
        
        const userProfile: UserProfile = {
            ...authUser,
            ...firestoreData,
            role: firestoreData?.role || 'user',
        }
        console.log('[useAuth] Setting user profile state:', userProfile);
        setUser(userProfile);

      } else {
        console.log('[useAuth] No user detected.');
        await setCookie(null);
        setUser(null);
      }
      console.log('[useAuth] Setting loading to false.');
      setLoading(false);
    });

    return () => {
      console.log('[useAuth] AuthProvider unmounted. Unsubscribing from onIdTokenChanged.');
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
