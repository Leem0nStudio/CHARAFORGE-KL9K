
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SpriteExtractorClient } from '@/components/sprite-extractor';
import { OptionsPanel } from '@/components/options-panel';
import { LogPanel } from '@/components/log-panel';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { PageHeader } from '@/components/page-header';

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
        addLog('Extraction process started...');
        addLog(`Options: minArea=${options.minArea}, engine=${options.engine}`);

        const formData = new FormData();
        formData.append('image', file);
        formData.append('options', JSON.stringify(options));
        
        addLog(`Uploading image: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

        try {
            const response = await fetch('/api/extract-sprites', {
                method: 'POST',
                body: formData,
            });
            
            addLog('Server is processing the image...');
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
    <motion.div
        className="container py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        <PageHeader 
            title="Sprite Extractor"
            description="Upload a sprite sheet, and let our AI-powered service extract individual sprites for you."
        />
        
        <div className="grid lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
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
    </motion.div>
  );
}
