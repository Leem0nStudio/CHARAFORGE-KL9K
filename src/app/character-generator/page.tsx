
'use client';

import { CharacterGenerator } from '@/components/character-generator';
import { BackButton } from '@/components/back-button';
import { motion } from 'framer-motion';

export default function CharacterGeneratorPage() {
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
                        Bring your vision to life. Describe your character, and let our AI do the rest.
                    </p>
                  </div>
              </div>
          </div>
          <CharacterGenerator />
      </motion.div>
  );
}
