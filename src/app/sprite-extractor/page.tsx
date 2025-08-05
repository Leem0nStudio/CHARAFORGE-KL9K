'use client';

import { useState } from 'react';
import { LoginButton } from '@/components/login-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { BackButton } from '@/components/back-button';
import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { SpriteExtractorClient } from '@/components/sprite-extractor';
import { OptionsPanel } from '@/components/options-panel';
import { LogPanel } from '@/components/log-panel';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export type ExtractionOptions = {
    minArea: number;
    engine: 'sharp' | 'opencv';
    resampleMode: 'nearest' | 'bilinear';
};

export default function SpriteExtractorPage() {
    const [options, setOptions] = useState<ExtractionOptions>({
        minArea: 100,
        engine: 'sharp',
        resampleMode: 'nearest',
    });
    const [logs, setLogs] = useState<string[]>([]);
    const [extractedSprites, setExtractedSprites] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { authUser } = useAuth();
    const { toast } = useToast();

    const addLog = (message: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const handleExtract = async (file: File) => {
        if (!file) {
            toast({ variant: 'destructive', title: 'No file selected' });
            return;
        }
        if (!authUser) {
            toast({ variant: 'destructive', title: 'Authentication Required' });
            return;
        }

        setIsLoading(true);
        setExtractedSprites([]);
        setLogs([]);
        setError(null);
        addLog('Starting extraction process...');

        const formData = new FormData();
        formData.append('image', file);
        // TODO: Pass options to API in Phase 2
        // formData.append('options', JSON.stringify(options));
        
        addLog(`Uploading image: ${file.name}`);

        try {
            const response = await fetch('/api/extract-sprites', {
                method: 'POST',
                body: formData,
            });
            
            addLog('Processing on server...');
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'An unknown server error occurred.');
            }
            
            addLog(`Extraction complete! Found ${result.spriteUrls.length} sprites.`);
            setExtractedSprites(result.spriteUrls);
            toast({
                title: 'Extraction Complete!',
                description: `Successfully extracted ${result.spriteUrls.length} sprites.`,
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to connect to the server.';
            addLog(`Error: ${message}`);
            setError(message);
            toast({ variant: 'destructive', title: 'Extraction Failed', description: message });
        } finally {
            setIsLoading(false);
            addLog('Process finished.');
        }
    };


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
            <div className="mx-auto grid w-full max-w-7xl gap-2 mb-8">
                 <div className="flex items-center gap-4">
                    <BackButton />
                    <h1 className="text-3xl font-semibold font-headline tracking-wider">Sprite Extractor</h1>
                </div>
                <p className="text-muted-foreground">
                    Upload a sprite sheet, and let our AI-powered service extract individual sprites for you.
                </p>
            </div>
            
            <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-3">
                    <OptionsPanel options={options} setOptions={setOptions} disabled={isLoading} />
                </div>
                <div className="lg:col-span-6">
                    <SpriteExtractorClient 
                        onExtract={handleExtract}
                        extractedSprites={extractedSprites}
                        isLoading={isLoading}
                        error={error}
                    />
                </div>
                <div className="lg:col-span-3">
                    <LogPanel logs={logs} />
                </div>
            </div>

        </motion.main>
     </div>
  );
}
