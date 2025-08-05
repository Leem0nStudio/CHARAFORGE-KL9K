
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
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/types/user';

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  // Añadir función para forzar refresh de token
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshSession: async () => {},
});

async function setCookie(token: string | null): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/set-cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      // CRÍTICO: Asegurar que las cookies se incluyan en requests
      credentials: 'same-origin',
    });

    if (!response.ok) {
      console.error('Failed to set cookie:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error setting cookie:', error);
    return false;
  }
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


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Función para refrescar la sesión manualmente
  const refreshSession = async () => {
    const { auth } = getFirebaseClient();
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      try {
        // Forzar refresh del token
        const token = await currentUser.getIdToken(true);
        const cookieSet = await setCookie(token);
        
        if (!cookieSet) {
          console.error('Failed to set session cookie');
          throw new Error('Failed to establish server session');
        }
        
        // Actualizar datos del usuario
        const firestoreData = await ensureUserDocument(currentUser);
        const userProfile: UserProfile = {
          ...currentUser,
          ...firestoreData,
          role: firestoreData?.role || 'user',
        }
        
        setUser(userProfile);
      } catch (error) {
        console.error('Error refreshing session:', error);
        // En caso de error, limpiar la sesión
        await setCookie(null);
        setUser(null);
      }
    }
  };

  useEffect(() => {
    const { auth } = getFirebaseClient();
    const unsubscribe = onIdTokenChanged(auth, async (authUser) => {
      setLoading(true);
      if (authUser) {
        try {
          const token = await authUser.getIdToken();
          
          // CRÍTICO: Esperar a que la cookie se establezca correctamente
          const cookieSet = await setCookie(token);
          
          if (!cookieSet) {
            console.error('Failed to set session cookie');
            setUser(null);
            setLoading(false);
            return;
          }

          // Pequeña pausa para asegurar que la cookie se propague
          await new Promise(resolve => setTimeout(resolve, 100));

          // Después de confirmar que la cookie se estableció, sincronizar Firestore
          const firestoreData = await ensureUserDocument(authUser);
          
          // Establecer estado del cliente con todos los datos disponibles
          const userProfile: UserProfile = {
              ...authUser,
              ...firestoreData,
              role: firestoreData?.role || 'user',
          }
          
          setUser(userProfile);
        } catch (error) {
          console.error('Error during authentication process:', error);
          // En caso de error, limpiar todo
          await setCookie(null);
          setUser(null);
        }
      } else {
        // Usuario desconectado, limpiar todo
        await setCookie(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
    
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
         <div className="w-full max-w-md p-8 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, refreshSession }}>
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
