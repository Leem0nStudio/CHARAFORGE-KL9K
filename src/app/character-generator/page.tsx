'use client';

import { CharacterGenerator } from '@/components/character-generator';
import { motion } from 'framer-motion';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { BackButton } from '@/components/back-button';

function CharacterGeneratorWrapper() {
  const { authUser, loading } = useAuth();
  
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
             <BackButton
                title="Character Generator"
                description="Bring your vision to life. Use a simple prompt or the DataPack Wizard to get started."
             />
        </div>
        <CharacterGenerator authUser={authUser} />
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
