
'use client';

import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from 'react';
import { User, onIdTokenChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, DocumentData, Timestamp } from 'firebase/firestore';
import { getFirebaseClient } from '@/lib/firebase/client';
import type { UserProfile } from '@/types/user';

export interface AuthContextType {
  authUser: User | null; // The original Firebase Auth User object
  userProfile: UserProfile | null; // The Firestore user profile data
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  authUser: null,
  userProfile: null,
  loading: true,
});

/**
 * Posts the token to a server-side API route to set an HTTPOnly cookie.
 * This is a critical step for server-side rendering and actions.
 * @param token The Firebase ID token, or null to clear the cookie.
 */
async function setCookie(token: string | null): Promise<void> {
  // The fetch request returns a promise. By awaiting it, we ensure this operation
  // completes before we proceed, solving the race condition.
  await fetch('/api/auth/set-cookie', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
}

const ensureUserDocument = async (user: User): Promise<DocumentData | null> => {
  const { db } = getFirebaseClient();
  if (!db) {
      console.error("[useAuth] Firestore (db) is not available in ensureUserDocument.");
      return null;
  }
  const userDocRef = doc(db, 'users', user.uid);
  try {
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
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
        const updateData: { displayName: string | null; photoURL: string | null; email?: string | null; lastLogin?: Timestamp } = {
          displayName: user.displayName,
          photoURL: user.photoURL,
          lastLogin: serverTimestamp() as Timestamp,
        };
        if (user.email !== userDoc.data()?.email) {
            updateData.email = user.email;
        }
        await updateDoc(userDocRef, updateData);
    }
    
    const updatedUserDoc = await getDoc(userDocRef);
    return updatedUserDoc.data() || null;

  } catch (error: unknown) {
    console.error("Error in ensureUserDocument:", error);
    return null;
  }
};

const AnvilIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="512" height="512" viewBox="0 0 512 512">
        <image xlinkHref="data:image/png;base64,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" x="0" y="0" width="512" height="512"/>
    </svg>
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { auth } = getFirebaseClient();
    const unsubscribe = onIdTokenChanged(auth, async (newAuthUser) => {
      setLoading(true);
      if (newAuthUser) {
        const token = await newAuthUser.getIdToken();
        await setCookie(token);

        setAuthUser(newAuthUser);
        const firestoreData = await ensureUserDocument(newAuthUser);
        
        setUserProfile({
            uid: newAuthUser.uid,
            email: newAuthUser.email,
            displayName: newAuthUser.displayName,
            photoURL: newAuthUser.photoURL,
            emailVerified: newAuthUser.emailVerified,
            isAnonymous: newAuthUser.isAnonymous,
            metadata: newAuthUser.metadata,
            providerData: newAuthUser.providerData,
            ...firestoreData
        });
      } else {
        await setCookie(null);
        setAuthUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
    
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-background">
         <AnvilIcon className="w-24 h-24 animate-pulse" />
         <p className="mt-4 text-muted-foreground font-headline tracking-wider animate-pulse">FORGING SESSION...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ authUser, userProfile, loading }}>
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
