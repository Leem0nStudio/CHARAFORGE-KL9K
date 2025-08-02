'use client';

import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from 'react';
import { User, onIdTokenChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
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
  // Use a server action to set the cookie
  try {
    const response = await fetch('/api/auth/set-cookie', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    if (!response.ok) {
      throw new Error('Failed to set auth cookie');
    }
  } catch (error) {
    console.error(error);
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth) {
      const unsubscribe = onIdTokenChanged(auth, async (user) => {
        if (user) {
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
    } else {
      setLoading(false);
    }
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