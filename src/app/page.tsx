
'use client';

import { useState } from 'react';
import { Bot, UploadCloud, Settings, FileText, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';

// --- Placeholder Components ---

const OptionsPanelPlaceholder = () => (
    <Card className="h-full">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" /> Options</CardTitle>
            <CardDescription>Extraction settings will go here.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-full animate-pulse"></div>
                <div className="h-8 bg-muted rounded w-full animate-pulse"></div>
                <div className="h-8 bg-muted rounded w-full animate-pulse"></div>
            </div>
        </CardContent>
    </Card>
);

const SpriteGridPlaceholder = ({ sprites }: { sprites: string[] }) => (
    <Card className="h-full min-h-[300px]">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><ImageIcon className="w-5 h-5" /> Sprites</CardTitle>
            <CardDescription>Extracted sprites will be displayed below.</CardDescription>
        </CardHeader>
        <CardContent>
            {sprites.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[200px] border-2 border-dashed rounded-lg text-muted-foreground">
                    <p>No sprites extracted yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                    {/* Map over sprites here */}
                </div>
            )}
        </CardContent>
    </Card>
);

const LogsPanelPlaceholder = ({ logs }: { logs: string[] }) => (
    <Card className="h-full">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Logs</CardTitle>
            <CardDescription>Processing logs will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="text-xs font-mono bg-muted rounded p-2 h-48 overflow-y-auto">
            {logs.length === 0 ? <p className="text-muted-foreground">Awaiting process...</p> : logs.map((log, i) => <p key={i}>{log}</p>)}
        </CardContent>
    </Card>
);


// --- Main Page Component ---

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [extractedSprites, setExtractedSprites] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>(['Initializing...']);
  const [options, setOptions] = useState({
    minArea: 100,
    canvasSize: 256,
  });

  return (
    <div className="min-h-screen w-full flex flex-col bg-muted/40">
        <header className="sticky top-0 z-40 w-full border-b bg-background">
         <div className="container flex h-16 items-center space-x-4">
             <Bot className="h-6 w-6 mr-2 text-primary" />
             <span className="font-bold font-headline text-2xl tracking-wider">Sprite Extractor</span>
         </div>
       </header>

       <main className="flex-1 p-4 md:p-6 lg:p-8 grid grid-cols-12 gap-6">
            {/* Columna Izquierda */}
            <motion.div 
                className="col-span-12 lg:col-span-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                <OptionsPanelPlaceholder />
            </motion.div>

            {/* Columna Central */}
            <motion.div 
                className="col-span-12 lg:col-span-6 space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UploadCloud className="w-5 h-5"/> Upload Image</CardTitle>
                        <CardDescription>Select a sprite sheet to begin the extraction process.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
                        <input type="file" className="hidden" id="file-upload"/>
                        <label htmlFor="file-upload" className="cursor-pointer text-center">
                            <p className="text-sm text-muted-foreground">Drag 'n' drop a file here, or click to select a file</p>
                            <Button asChild className="mt-4"><span>Choose File</span></Button>
                        </label>
                    </CardContent>
                </Card>
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <SpriteGridPlaceholder sprites={extractedSprites} />
                    </motion.div>
                </AnimatePresence>
            </motion.div>

            {/* Columna Derecha */}
            <motion.div 
                className="col-span-12 lg:col-span-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <LogsPanelPlaceholder logs={logs} />
            </motion.div>
       </main>
    </div>
  );
}
