
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
import { User, onIdTokenChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, DocumentData, Timestamp } from 'firebase/firestore';
import { getFirebaseClient } from '@/lib/firebase/client';
import type { UserProfile } from '@/types/user';

export interface AuthContextType {
  authUser: User | null; // The original Firebase Auth User object
  userProfile: UserProfile | null; // The Firestore user profile data
  setUserProfile: Dispatch<SetStateAction<UserProfile | null>>; // Allow updating the profile from components
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  authUser: null,
  userProfile: null,
  setUserProfile: () => {},
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
          installedPacks: ['basic-fantasy-pack'],
          subscriptionTier: 'free',
          memberSince: serverTimestamp(),
        }
      });
    } else {
        const updateData: { displayName: string | null; photoURL: string | null; email?: string | null } = {
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        if (user.email !== userDoc.data()?.email) {
            updateData.email = user.email;
        }
        await updateDoc(userDocRef, { ...updateData });
    }
    
    const updatedUserDoc = await getDoc(userDocRef);
    const data = updatedUserDoc.data();

    // Convert any Timestamps to serializable Dates before returning
    if (data) {
        if (data.createdAt && data.createdAt instanceof Timestamp) {
            data.createdAt = data.createdAt.toMillis();
        }
        if (data.stats && data.stats.memberSince instanceof Timestamp) {
           data.stats.memberSince = data.stats.memberSince.toMillis();
        }
    }
    return data || null;

  } catch (error: unknown) {
    console.error("Error in ensureUserDocument:", error);
    return null;
  }
};

export const AnvilIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <defs>
             <linearGradient id="anvilGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(36 91% 52%)" />
                <stop offset="100%" stopColor="hsl(var(--accent))" />
            </linearGradient>
        </defs>
        <path fill="url(#anvilGradient)" d="M494.67 203.26C494.67 175.7 482.37 151 462.61 134.42C442.84 117.84 417.16 107.59 389.33 107.59H378.67V58.52C378.67 35.87 362.4 17.07 342.64 0H169.36C149.6 17.07 133.33 35.87 133.33 58.52V107.59H122.67C94.84 107.59 69.16 117.84 49.39 134.42C29.63 151 17.33 175.7 17.33 203.26V231.25H494.67V203.26ZM184.53 158.58C177.65 158.58 172.27 153.2 172.27 146.31V72.5C172.27 65.6 177.65 60.22 184.53 60.22C191.42 60.22 196.8 65.6 196.8 72.5V146.31C196.8 153.2 191.42 158.58 184.53 158.58ZM327.47 158.58C320.58 158.58 315.2 153.2 315.2 146.31V72.5C315.2 65.6 320.58 60.22 327.47 60.22C334.35 60.22 339.73 65.6 339.73 72.5V146.31C339.73 153.2 334.35 158.58 327.47 158.58Z M0 259.23V404.99C0 422.03 5.43 438.16 16.28 451.5C27.13 464.84 42.11 474.83 61.22 479.51L109.33 492.41V512H402.67V492.41L450.78 479.51C469.89 474.83 484.87 464.84 495.72 451.5C506.57 438.16 512 422.03 512 404.99V259.23H0Z"/>
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
        // This is the critical change: ensure the server-side cookie is set
        // before we proceed, solving the race condition.
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
         <AnvilIcon className="w-24 h-24 animate-pulse-glow" />
         <p className="mt-4 text-muted-foreground font-headline tracking-wider animate-subtle-pulse">FORGING SESSION...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ authUser, userProfile, setUserProfile, loading }}>
      {children}
    </Auth.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
