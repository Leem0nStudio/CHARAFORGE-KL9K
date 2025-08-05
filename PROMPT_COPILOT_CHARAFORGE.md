# 🤖 Prompt Completo para Copilot - CharaForge

## 📋 **PROMPT PRINCIPAL**

```
Crea una aplicación web completa llamada "CharaForge" usando Next.js 15 (App Router), TypeScript, Firebase y IA. 

CharaForge es una plataforma para crear personajes ficticios usando inteligencia artificial. Los usuarios pueden generar biografías detalladas e imágenes de personajes a partir de descripciones simples.

ARQUITECTURA TÉCNICA:
- Frontend: Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Firebase (Auth, Firestore, Storage) + Server Actions
- IA: Google Genkit + Gemini 1.5 Flash (biografías) + Gemini 2.0 Flash (imágenes)
- Estilos: Tailwind CSS + tema oscuro/claro
- Iconos: Lucide React

ESTRUCTURA DEL PROYECTO:
```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── character-generator/
│   │   └── page.tsx
│   ├── characters/
│   │   └── page.tsx
│   ├── profile/
│   │   └── page.tsx
│   ├── admin/
│   │   └── page.tsx
│   └── api/
│       └── auth/
│           └── set-cookie/
│               └── route.ts
├── components/
│   ├── ui/ (shadcn components)
│   ├── character-generator.tsx
│   ├── login-button.tsx
│   └── theme-toggle.tsx
├── hooks/
│   └── use-auth.tsx
├── lib/
│   ├── firebase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── utils.ts
├── types/
│   ├── character.ts
│   └── user.ts
└── ai/
    ├── genkit.ts
    └── flows/
        ├── generate-character-bio.ts
        ├── generate-character-image.ts
        └── save-character.ts
```

FUNCIONALIDADES PRINCIPALES:
1. Sistema de autenticación completo (registro/login/logout)
2. Generador de personajes con IA (descripción → biografía + imagen)
3. Galería de personajes (privados/públicos)
4. Perfiles de usuario
5. Panel de administración
6. Tema claro/oscuro

ESPECIFICACIONES DETALLADAS A CONTINUACIÓN...
```

## 🔧 **CONFIGURACIÓN INICIAL**

### **1. Setup del Proyecto**

```bash
# Inicializar proyecto
npx create-next-app@latest charaforge --typescript --tailwind --app --src-dir --eslint

# Dependencias principales
npm install firebase firebase-admin
npm install @genkit-ai/firebase @genkit-ai/googleai @genkit-ai/next genkit genkit-cli
npm install @hookform/resolvers react-hook-form zod
npm install @radix-ui/react-avatar @radix-ui/react-button @radix-ui/react-card
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-form
npm install @radix-ui/react-input @radix-ui/react-label @radix-ui/react-select
npm install @radix-ui/react-separator @radix-ui/react-textarea @radix-ui/react-toast
npm install lucide-react next-themes class-variance-authority clsx tailwind-merge
npm install framer-motion date-fns

# Dependencias de desarrollo
npm install -D @types/node dotenv tsx
```

### **2. Configuración de Variables de Entorno**

```env
# .env.local
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Server
FIREBASE_SERVICE_ACCOUNT_KEY=

# Google AI
GOOGLE_AI_API_KEY=

# Opcionales
NEXT_PUBLIC_USE_EMULATORS=false
```

## 🎨 **DISEÑO Y ESTILOS**

### **3. Configuración de Tailwind (tailwind.config.ts)**

```typescript
import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        body: ['"Exo 2"', 'sans-serif'],
        headline: ['"Bebas Neue"', 'sans-serif'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
```

### **4. Estilos Globales (globals.css)**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Exo+2:ital,wght@0,100..900;1,100..900&display=swap');

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 227 66% 10%;
    --card: 0 0% 100%;
    --card-foreground: 227 66% 10%;
    --primary: 227 66% 33%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 227 66% 10%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 227 66% 30%;
    --accent: 38 92% 51%;
    --accent-foreground: 0 0% 100%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 227 66% 33%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 227 66% 5%;
    --foreground: 210 40% 98%;
    --card: 227 66% 8%;
    --card-foreground: 210 40% 98%;
    --primary: 227 66% 55%;
    --primary-foreground: 227 66% 5%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 38 92% 51%;
    --accent-foreground: 227 66% 5%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 227 66% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-body;
  }
}
```

## 🔥 **FIREBASE CONFIGURATION**

### **5. Firebase Client (lib/firebase/client.ts)**

```typescript
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';

type FirebaseClientServices = {
    app: FirebaseApp;
    auth: Auth;
    db: Firestore;
};

export function getFirebaseClient(): FirebaseClientServices {
    const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    if (!firebaseConfig.projectId) {
        throw new Error("Firebase configuration is incomplete. Please check your NEXT_PUBLIC_FIREBASE_* variables.");
    }

    let app: FirebaseApp;

    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    
    const auth = getAuth(app);
    const db = getFirestore(app);

    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
        try {
            connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
            connectFirestoreEmulator(db, '127.0.0.1', 8080);
        } catch (error) {
           // Ignore if already connected
        }
    }

    return { app, auth, db };
}
```

### **6. Firebase Server (lib/firebase/server.ts)**

```typescript
import { initializeApp, getApps, App, ServiceAccount, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;

function initializeAdmin() {
  if (getApps().length === 0) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      console.error('[Firebase Admin] FATAL: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
      return; 
    }

    try {
      const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKey);
      
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });

      adminAuth = getAuth(adminApp);
      adminDb = getFirestore(adminApp);

    } catch (e) {
      console.error('[Firebase Admin] Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', e);
    }
  } else {
      adminApp = getApps()[0];
      adminAuth = getAuth(adminApp);
      adminDb = getFirestore(adminApp);
  }
}

initializeAdmin();

export { adminApp, adminDb, adminAuth };
```

## 🤖 **GOOGLE AI CONFIGURATION**

### **7. Genkit Setup (ai/genkit.ts)**

```typescript
import { genkit } from 'genkit'; 
import { config } from 'dotenv';
import { enableFirebaseTelemetry } from '@genkit-ai/firebase';
import { googleAI } from '@genkit-ai/googleai';

config({ path: '.env' });

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});

enableFirebaseTelemetry();
```

### **8. Character Bio Generation (ai/flows/generate-character-bio.ts)**

```typescript
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCharacterBioInputSchema = z.object({
  description: z.string().describe('A description of the character.'),
});
export type GenerateCharacterBioInput = z.infer<typeof GenerateCharacterBioInputSchema>;

const GenerateCharacterBioOutputSchema = z.object({
  biography: z.string().describe('The generated biography of the character.'),
});
export type GenerateCharacterBioOutput = z.infer<typeof GenerateCharacterBioOutputSchema>;

export async function generateCharacterBio(input: GenerateCharacterBioInput): Promise<GenerateCharacterBioOutput> {
  return generateCharacterBioFlow(input);
}

const generateCharacterBioPrompt = ai.definePrompt({
  name: 'generateCharacterBioPrompt',
  input: {schema: GenerateCharacterBioInputSchema},
  output: {schema: GenerateCharacterBioOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are a professional writer specializing in character biographies.

  Based on the provided description, generate a detailed and engaging biography for the character.

  Description: {{{description}}}`,
});

const generateCharacterBioFlow = ai.defineFlow(
  {
    name: 'generateCharacterBioFlow',
    inputSchema: GenerateCharacterBioInputSchema,
    outputSchema: GenerateCharacterBioOutputSchema,
  },
  async input => {
    const {output} = await generateCharacterBioPrompt(input);
    return output!;
  }
);
```

### **9. Character Image Generation (ai/flows/generate-character-image.ts)**

```typescript
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCharacterImageInputSchema = z.object({
  description: z.string().describe('The description of the character.'),
});
export type GenerateCharacterImageInput = z.infer<typeof GenerateCharacterImageInputSchema>;

const GenerateCharacterImageOutputSchema = z.object({
  imageUrl: z
    .string()
    .describe('The generated image as a data URI, including MIME type and Base64 encoding.'),
});
export type GenerateCharacterImageOutput = z.infer<typeof GenerateCharacterImageOutputSchema>;

export async function generateCharacterImage(
  input: GenerateCharacterImageInput
): Promise<GenerateCharacterImageOutput> {
  return generateCharacterImageFlow(input);
}

const generateCharacterImageFlow = ai.defineFlow(
  {
    name: 'generateCharacterImageFlow',
    inputSchema: GenerateCharacterImageInputSchema,
    outputSchema: GenerateCharacterImageOutputSchema,
  },
  async input => {
    try {
        const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: input.description,
        config: {
            responseModalities: ['TEXT', 'IMAGE'],
        },
        });

        const imageUrl = media?.url;
        if (!imageUrl) {
          throw new Error('AI model did not return an image.');
        }

        return {imageUrl};
    } catch (error) {
        console.error("Error generating character image:", error);
        throw new Error("Failed to generate character image.");
    }
  }
);
```

## 🔐 **AUTHENTICATION SYSTEM**

### **10. Auth Hook (hooks/use-auth.tsx)**

```typescript
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
      credentials: 'same-origin',
    });

    return response.ok;
  } catch (error) {
    console.error('Error setting cookie:', error);
    return false;
  }
}

const ensureUserDocument = async (user: User): Promise<DocumentData | null> => {
  const { db } = getFirebaseClient();
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
        await updateDoc(userDocRef, {
          displayName: user.displayName,
          photoURL: user.photoURL,
          lastLogin: serverTimestamp(),
        });
    }
    
    const updatedUserDoc = await getDoc(userDocRef);
    return updatedUserDoc.data() || null;

  } catch (error) {
    console.error("Error in ensureUserDocument:", error);
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    const { auth } = getFirebaseClient();
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken(true);
        const cookieSet = await setCookie(token);
        
        if (cookieSet) {
          const firestoreData = await ensureUserDocument(currentUser);
          const userProfile: UserProfile = {
            ...currentUser,
            ...firestoreData,
            role: firestoreData?.role || 'user',
          }
          
          setUser(userProfile);
        }
      } catch (error) {
        console.error('Error refreshing session:', error);
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
          const cookieSet = await setCookie(token);
          
          if (!cookieSet) {
            setUser(null);
            setLoading(false);
            return;
          }

          await new Promise(resolve => setTimeout(resolve, 100));

          const firestoreData = await ensureUserDocument(authUser);
          const userProfile: UserProfile = {
              ...authUser,
              ...firestoreData,
              role: firestoreData?.role || 'user',
          }
          
          setUser(userProfile);
        } catch (error) {
          console.error('Error during authentication process:', error);
          await setCookie(null);
          setUser(null);
        }
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
```

### **11. Set Cookie API Route (app/api/auth/set-cookie/route.ts)**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/server';

const AUTH_COOKIE_NAME = 'firebaseIdToken';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    const response = NextResponse.json({ success: true });

    if (token) {
      if (adminAuth) {
        try {
          await adminAuth.verifyIdToken(token);
        } catch (error) {
          console.error('Invalid token provided to set-cookie:', error);
          return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
      }

      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      });
    } else {
      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
    }

    return response;
  } catch (error) {
    console.error('Error in set-cookie route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## 📝 **TYPES DEFINITIONS**

### **12. User Types (types/user.ts)**

```typescript
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'user' | 'admin';
  createdAt?: any;
  lastLogin?: any;
  stats?: {
    charactersCreated: number;
    totalLikes: number;
    collectionsCreated: number;
    installedPacks: string[];
    subscriptionTier: string;
    memberSince?: any;
  };
}
```

### **13. Character Types (types/character.ts)**

```typescript
import type { Timestamp } from "firebase/firestore";

export type Character = {
  id: string;
  name: string;
  description: string;
  biography: string;
  imageUrl: string;
  userId: string;
  status: 'private' | 'public';
  createdAt: Timestamp | Date;
  userName?: string;
};
```

## 🎨 **UI COMPONENTS**

### **14. Login Button (components/login-button.tsx)**

```typescript
'use client';

import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { getFirebaseClient } from '@/lib/firebase/client';
import { LogIn, LogOut, User } from 'lucide-react';

export function LoginButton() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { auth } = getFirebaseClient();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      const { auth } = getFirebaseClient();
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span className="text-sm">{user.displayName || user.email}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={loading}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleLogin} disabled={loading}>
      <LogIn className="w-4 h-4 mr-2" />
      {loading ? 'Logging in...' : 'Login with Google'}
    </Button>
  );
}
```

### **15. Theme Toggle (components/theme-toggle.tsx)**

```typescript
'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

## 🏗️ **MAIN LAYOUTS**

### **16. Root Layout (app/layout.tsx)**

```typescript
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import './globals.css';
import { AuthProvider } from '@/hooks/use-auth';

export const metadata: Metadata = {
  title: 'CharaForge',
  description: 'AI-powered character and image generation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Exo+2:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('min-h-screen bg-background font-body antialiased')}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### **17. Home Page (app/page.tsx)**

```typescript
import Image from 'next/image';
import Link from 'next/link';
import { Bot, Swords, Rocket, ScrollText, User } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LoginButton } from '@/components/login-button';
import { adminDb } from '@/lib/firebase/server';
import type { Character } from '@/types/character';

async function getFeaturedCharacters(): Promise<Character[]> {
  if (!adminDb) {
    return [];
  }
  try {
    const snapshot = await adminDb
      .collection('characters')
      .where('status', '==', 'public')
      .orderBy('createdAt', 'desc')
      .limit(4)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      const createdAtDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
      return {
        id: doc.id,
        name: data.name || 'Unnamed Character',
        description: data.description || '',
        biography: data.biography || '',
        imageUrl: data.imageUrl || '',
        userId: data.userId,
        status: data.status,
        createdAt: createdAtDate,
        userName: data.userName || 'Anonymous',
      };
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
        console.error("Error fetching featured characters:", error);
    }
    return [];
  }
}

export default async function HomePage() {
  const featuredCharacters = await getFeaturedCharacters();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-headline font-bold tracking-wider">CharaForge</h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/character-generator" className={buttonVariants({ variant: "ghost" })}>
              Create
            </Link>
            <Link href="/characters" className={buttonVariants({ variant: "ghost" })}>
              Gallery
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LoginButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-4xl font-headline font-bold tracking-tight sm:text-6xl">
            Forge Extraordinary Characters with AI
          </h1>
          <p className="text-xl text-muted-foreground">
            Transform your ideas into stunning character portraits and rich biographies. 
            Let AI bring your imagination to life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/character-generator" className={buttonVariants({ size: "lg" })}>
              <Swords className="mr-2 h-5 w-5" />
              Start Creating
            </Link>
            <Link href="/characters" className={buttonVariants({ variant: "outline", size: "lg" })}>
              <ScrollText className="mr-2 h-5 w-5" />
              Browse Gallery
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Characters */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-headline font-bold mb-4">Featured Characters</h2>
          <p className="text-muted-foreground">Discover amazing characters created by our community</p>
        </div>
        
        {featuredCharacters.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {featuredCharacters.map((character) => (
              <Card key={character.id} className="overflow-hidden">
                <div className="aspect-square relative">
                  <Image
                    src={character.imageUrl}
                    alt={character.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="font-headline">{character.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {character.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{character.userName?.[0] || 'A'}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {character.userName}
                    </span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No characters yet</h3>
            <p className="text-muted-foreground mb-6">Be the first to create a character!</p>
            <Link href="/character-generator" className={buttonVariants()}>
              Create First Character
            </Link>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-muted-foreground">
          <p>&copy; 2024 CharaForge. Powered by AI.</p>
        </div>
      </footer>
    </div>
  );
}
```

## 🎯 **FUNCIONALIDADES ESPECÍFICAS**

### **18. Character Generator Page (app/character-generator/page.tsx)**

```typescript
'use client';

import { CharacterGenerator } from '@/components/character-generator';

export default function CharacterGeneratorPage() {
  return (
    <div className="container mx-auto p-4">
      <CharacterGenerator />
    </div>
  );
}
```

### **19. Save Character Server Action (ai/flows/save-character.ts)**

```typescript
'use server';

import { z } from 'zod';
import { adminDb, adminAuth } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';

const SaveCharacterInputSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string(),
  biography: z.string(),
  imageUrl: z.string(),
});
export type SaveCharacterInput = z.infer<typeof SaveCharacterInputSchema>;

async function getAuthenticatedUser(): Promise<{uid: string, name: string}> {
  try {
    const cookieStore = await cookies();
    const idToken = cookieStore.get('firebaseIdToken')?.value;

    if (!idToken) {
      throw new Error('User session not found. Please log in again.');
    }
    
    if (!adminAuth) {
      throw new Error('Authentication service is not configured. Please contact support.');
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const displayName = decodedToken.name || decodedToken.email?.split('@')[0] || 'Anonymous';
    return { uid: decodedToken.uid, name: displayName };
      
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('User session not found') || 
          error.message.includes('Authentication service is not configured')) {
        throw error;
      }
      
      if (error.message.includes('expired')) {
        throw new Error('Your session has expired. Please log in again.');
      }
      if (error.message.includes('invalid')) {
        throw new Error('Invalid session. Please log in again.');
      }
    }
    
    console.error('Authentication error:', error);
    throw new Error('Authentication failed. Please try logging in again.');
  }
}

export async function saveCharacter(input: SaveCharacterInput) {
  try {
    const validation = SaveCharacterInputSchema.safeParse(input);
    if (!validation.success) {
      throw new Error(`Invalid character data: ${validation.error.message}`);
    }
    
    if (!adminDb) {
      throw new Error('Database service is not configured. Please contact support.');
    }

    const { name, description, biography, imageUrl } = validation.data;
    
    const authUser = await getAuthenticatedUser();
    const { uid: userId, name: userName } = authUser;

    const characterRef = adminDb.collection('characters').doc();
    const userRef = adminDb.collection('users').doc(userId);

    await adminDb.runTransaction(async (transaction) => {
        transaction.set(characterRef, {
            userId,
            userName,
            name,
            description,
            biography,
            imageUrl,
            status: 'private',
            createdAt: FieldValue.serverTimestamp(),
        });

        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists() || !userDoc.data()?.stats) {
            transaction.set(userRef, { 
                stats: { charactersCreated: 1 } 
            }, { merge: true });
        } else {
            transaction.update(userRef, {
                'stats.charactersCreated': FieldValue.increment(1)
            });
        }
    });

    return { success: true, characterId: characterRef.id };
      
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('saveCharacter error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
    
    if (error instanceof Error) {
      if (error.message.includes('not configured') || 
          error.message.includes('session not found') ||
          error.message.includes('session has expired') ||
          error.message.includes('Invalid session')) {
        throw error;
      }
    }
    
    throw new Error('Could not save character. Please try again.');
  }
}
```

### **20. Package.json Scripts**

```json
{
  "scripts": {
    "dev": "next dev -p 9002",
    "genkit:dev": "node --loader tsx src/ai/dev.ts",
    "genkit:watch": "node --watch --loader tsx src/ai/dev.ts",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "firebase:setup": "node scripts/firebase-setup.js",
    "firebase:emulators": "firebase emulators:start --only auth,firestore",
    "admin:grant": "node --loader tsx scripts/manage-admin.js grant",
    "admin:revoke": "node --loader tsx scripts/manage-admin.js revoke",
    "admin:check": "node --loader tsx scripts/manage-admin.js check",
    "admin:list": "node --loader tsx scripts/manage-admin.js list"
  }
}
```

## 🚀 **INSTRUCCIONES FINALES PARA EL COPILOT**

```
INSTRUCCIONES FINALES:

1. ESTRUCTURA: Crea todos los archivos en la estructura exacta especificada
2. DEPENDENCIAS: Instala todas las dependencias listadas
3. CONFIGURACIÓN: Asegúrate de que todos los archivos de configuración estén correctos
4. FIREBASE: Configura Firebase Auth, Firestore y Storage
5. TIPOS: Usa TypeScript estricto con todos los tipos definidos
6. ESTILOS: Implementa el sistema de diseño con Tailwind CSS y tema oscuro/claro
7. TESTING: Asegúrate de que la autenticación y generación de personajes funcionen
8. VALIDACIÓN: Implementa validación robusta con Zod
9. ERROR HANDLING: Maneja todos los errores apropiadamente
10. SEGURIDAD: Implementa reglas de seguridad de Firebase

RESULTADO ESPERADO:
- Aplicación web completamente funcional
- Sistema de autenticación con Google
- Generador de personajes con IA
- Galería de personajes
- Tema claro/oscuro
- Responsive design
- Error handling robusto

NOTA IMPORTANTE: 
Esta aplicación requiere configuración de Firebase y Google AI Studio. 
Proporciona instrucciones claras para que el usuario configure las variables de entorno.
```

---

Este prompt está diseñado para que un copilot de código pueda recrear CharaForge completamente funcional siguiendo las especificaciones exactas. ¿Te gustaría que ajuste alguna parte específica o añada más detalles en alguna sección?