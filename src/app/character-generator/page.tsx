
'use client';

import { CharacterGenerator } from '@/components/character-generator';
import { BackButton } from '@/components/back-button';
import { motion } from 'framer-motion';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';


// Since the page now uses useSearchParams, it must be a Client Component.
// The data fetching and heavy lifting is in CharacterGenerator, so this is fine.
// We wrap it in a Suspense boundary to handle the initial render.

function CharacterGeneratorWrapper() {
  return (
    <motion.div
      className="container py-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
        <div className="mx-auto grid w-full max-w-7xl gap-2 mb-8">
             <div className="flex items-center gap-4">
                <BackButton />
                <div>
                  <h1 className="text-3xl font-semibold font-headline tracking-wider">Character Generator</h1>
                  <p className="text-muted-foreground">
                      Bring your vision to life. Describe your character, or use a DataPack to get started.
                  </p>
                </div>
            </div>
        </div>
        <CharacterGenerator />
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

