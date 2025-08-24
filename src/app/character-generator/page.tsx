
'use client';

import { CharacterGenerator } from '@/components/character-generator';
import { motion } from 'framer-motion';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

function CharacterGeneratorWrapper() {
  const { authUser, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      className="container py-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
        <div className="mx-auto grid w-full max-w-7xl gap-2 mb-8">
             <h1 className="text-3xl font-bold tracking-tight font-headline">Character Generator</h1>
             <p className="text-muted-foreground">Bring your vision to life. Describe your character, or use a DataPack to get started.</p>
        </div>
        <CharacterGenerator authUser={authUser}/>
    </motion.div>
  )
}


export default function CharacterGeneratorPage() {
  return (
    <Suspense fallback={
        <div className="flex items-center justify-center h-screen w-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    }>
      <CharacterGeneratorWrapper />
    </Suspense>
  );
}
