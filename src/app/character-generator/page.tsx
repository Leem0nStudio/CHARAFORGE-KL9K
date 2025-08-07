
'use client';

import { CharacterGenerator } from '@/components/character-generator';
import { PageHeader } from '@/components/page-header';
import { motion } from 'framer-motion';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function CharacterGeneratorWrapper() {
  return (
    <motion.div
      className="container py-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
        <PageHeader 
            title="Character Generator"
            description="Bring your vision to life. Describe your character, or use a DataPack to get started."
        />
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
