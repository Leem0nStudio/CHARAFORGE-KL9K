'use client';

import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from 'react';
import { User, onIdTokenChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { Skeleton } from '@/components/ui/skeleton';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

async function setCookie(token: string | null) {
  try {
    await fetch('/api/auth/set-cookie', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
  } catch (error) {
    console.error('Failed to set auth cookie:', error);
  }
}

/**
 * Ensures a user document exists in Firestore.
 * Creates one if it doesn't.
 * @param user The Firebase Auth user object.
 */
const ensureUserDocument = async (user: User) => {
  if (!db) return; // Firestore might not be initialized
  const userDocRef = doc(db, 'users', user.uid);
  try {
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      // User document doesn't exist, create it.
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        createdAt: serverTimestamp(),
        photoURL: user.photoURL,
        role: 'user',
      });
    }
  } catch (error) {
    console.error("Error ensuring user document exists:", error);
  }
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        await ensureUserDocument(user);
        const token = await user.getIdToken();
        await setCookie(token);
        setUser(user);
      } else {
        await setCookie(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
    
  }, []);

  if (loading) {
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
