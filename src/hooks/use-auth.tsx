'use client';

import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from 'react';
import { User, onIdTokenChanged, type Auth } from 'firebase/auth';
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

async function setCookie(token: string | null) {
  try {
    await fetch('/api/auth/set-cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  } catch (error: unknown) {
    // Silently fail on cookie setting error
  }
}

const ensureUserDocument = async (user: User): Promise<DocumentData | null> => {
  if (!db || !db.collection) return null; 
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
    return updatedUserDoc.data() || null;

  } catch (error: unknown) {
    return null;
  }
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isAuthReady = auth && typeof (auth as Auth).onIdTokenChanged === 'function';

    if (!isAuthReady) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onIdTokenChanged(auth, async (authUser) => {
      if (authUser) {
        const token = await authUser.getIdToken();
        const firestoreData = await ensureUserDocument(authUser);
        
        await setCookie(token);
        
        const userProfile: UserProfile = {
            ...authUser,
            ...firestoreData,
            role: firestoreData?.role || 'user',
        }
        setUser(userProfile);

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
