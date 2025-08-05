'use client';

import { SpriteExtractor } from '@/components/sprite-extractor';
import { LoginButton } from '@/components/login-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { BackButton } from '@/components/back-button';
import { Bot, Scissors } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function SpriteExtractorPage() {
  return (
     <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 z-40 w-full border-b bg-background">
         <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
            <Link href="/" className="flex items-center gap-2">
                <Bot className="h-6 w-6 mr-2 text-primary" />
                <span className="font-bold font-headline text-2xl tracking-wider">CharaForge</span>
            </Link>
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
                    <h1 className="text-3xl font-semibold font-headline tracking-wider">Sprite Extractor</h1>
                </div>
                <p className="text-muted-foreground">
                    Upload a sprite sheet, and let our AI-powered service extract individual sprites for you.
                </p>
            </div>
            <SpriteExtractor />
        </motion.main>
     </div>
  );
}
