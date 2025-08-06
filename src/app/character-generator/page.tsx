
'use client';

import { CharacterGenerator } from '@/components/character-generator';
import { LoginButton } from '@/components/login-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { BackButton } from '@/components/back-button';
import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CharacterGeneratorPage() {
  return (
     <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 z-40 w-full border-b bg-background">
         <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
            <div className="flex gap-6 md:gap-10">
                <Bot className="h-6 w-6 mr-2 text-primary" />
                 <div className="font-bold font-headline text-2xl tracking-wider">
                    <span className="text-foreground">Chara</span><span className="text-accent">Forge</span>
                </div>
            </div>
           <div className="flex flex-1 items-center justify-end space-x-4">
             <nav className="flex items-center space-x-1">
               <LoginButton />
               <ThemeToggle />
             </nav>
           </div>
         </div>
       </header>
        <motion.main
          className="flex-1 p-4 md:p-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
            <div className="mx-auto grid w-full max-w-6xl gap-2 mb-8">
                 <div className="flex items-center gap-4">
                    <BackButton />
                    <h1 className="text-3xl font-semibold font-headline tracking-wider">Character Generator</h1>
                </div>
                <p className="text-muted-foreground">
                    Bring your vision to life. Describe your character, and let our AI do the rest.
                </p>
            </div>
            <CharacterGenerator />
        </motion.main>
     </div>
  );
}
