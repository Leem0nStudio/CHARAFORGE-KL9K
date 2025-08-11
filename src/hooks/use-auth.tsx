
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
import { cn } from '@/lib/utils';

// Define the AnvilIcon directly here for the loading state.
// It's a simple, sychronous component safe for client-side use.
function AnvilIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-6 w-6", className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="anvilGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--accent))" />
          <stop offset="100%" stopColor="hsl(var(--primary))" />
        </linearGradient>
      </defs>
      <path
        d="M4 6L2 8V11H4V8H6V6H4ZM7 5V8H5V11H7V14H9V5H7ZM10 4V14H12V4H10ZM13 5V14H15V5H13ZM16 6V8H18V11H20L22 8V6H16ZM5 16V18H7V21H17V18H19V16H5Z"
        fill="url(#anvilGradient)"
      />
    </svg>
  );
}


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
        // **CRITICAL CHANGE**: Wait for the cookie to be set on the server
        // before proceeding to update the client-side state. This ensures
        // that any subsequent Server Action calls will have the session.
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
      // **CRITICAL CHANGE**: Only set loading to false after all async
      // operations (cookie setting, firestore doc check) are complete.
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

export { AnvilIcon };
