
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
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <defs>
      <linearGradient id="anvilGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: 'hsl(var(--accent))' }} />
        <stop offset="100%" style={{ stopColor: '#FBBF24' /* yellow-400 */ }} />
      </linearGradient>
    </defs>
    <path
      d="M7.7 13.4A4.6 4.6 0 0 0 9 15.5c.3.8.6 1.5.9 2.2a2.3 2.3 0 0 1-2.1 3.4h-1.6a2.3 2.3 0 0 1-2.1-3.4c.3-.7.6-1.4.9-2.2a4.6 4.6 0 0 0 1.3-2.1"
      stroke="url(#anvilGradient)"
    />
    <path
      d="M17.8 4c-1.3 0-2.3 1-2.3 2.3v3.2c0 .8-.5 1.6-1.2 1.8a2.3 2.3 0 0 0-2.6 2.3v.4a2.3 2.3 0 0 1-2.3 2.3h-1"
      stroke="url(#anvilGradient)"
    />
    <path
      d="M20 4h-2.2"
      stroke="url(#anvilGradient)"
    />
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
        // ** THE CRITICAL FIX **
        // We now `await` the cookie setting operation. This pauses execution
        // here until the server has confirmed the cookie is set. Only then
        // do we update the state and render the application.
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
        // If logging out, we also ensure the cookie is cleared before proceeding.
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

    