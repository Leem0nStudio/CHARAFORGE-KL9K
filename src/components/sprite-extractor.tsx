'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, Loader2, Wand2, Grid, AlertCircle, Check, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SpriteExtractorClientProps {
    onExtract: (file: File) => void;
    extractedSprites: string[];
    isLoading: boolean;
    error: string | null;
}


export function SpriteExtractorClient({ onExtract, extractedSprites, isLoading, error }: SpriteExtractorClientProps) {
  const { authUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please select an image smaller than 5MB.',
        });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtractClick = () => {
    if (selectedFile) {
      onExtract(selectedFile);
    } else {
        toast({
            variant: 'destructive',
            title: 'No file selected',
            description: 'Please select an image file to extract sprites from.',
        });
    }
  }

  const canExtract = selectedFile && !isLoading && !authLoading && authUser;

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">1. Upload Sprite Sheet</CardTitle>
          <CardDescription>Select an image containing the sprites you want to extract.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="sprite-sheet-upload">Sprite Image</Label>
            <Input id="sprite-sheet-upload" type="file" accept="image/png, image/jpeg" onChange={handleFileChange} disabled={isLoading} />
          </div>

          {previewUrl && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <Label>Preview</Label>
              <div className="mt-2 relative w-full aspect-video rounded-lg border bg-muted overflow-hidden">
                <Image src={previewUrl} alt="Selected sprite sheet preview" fill objectFit="contain" />
              </div>
            </motion.div>
          )}

          <Button onClick={handleExtractClick} disabled={!canExtract} size="lg" className="w-full font-headline text-lg">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-5 w-5" />
                Extract Sprites
              </>
            )}
          </Button>
          {!authUser && !authLoading && <p className="text-xs text-center text-muted-foreground">You must be logged in to extract sprites.</p>}
        </CardContent>
      </Card>

      <Card className="shadow-lg min-h-[400px]">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">2. Extracted Sprites</CardTitle>
          <CardDescription>Review the extracted sprites below. You can save them to your gallery.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="w-full aspect-square rounded-lg" />
              ))}
            </div>
          )}

          {!isLoading && error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Extraction Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isLoading && !error && extractedSprites.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[200px] border-2 border-dashed rounded-lg bg-card/50">
              <Grid className="h-12 w-12 mb-4 text-primary" />
              <p className="text-lg font-medium font-headline tracking-wider">Awaiting Extraction</p>
              <p className="text-sm">Your sprites will appear here once extracted.</p>
            </div>
          )}

          <AnimatePresence>
            {extractedSprites.length > 0 && (
              <motion.div 
                className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {extractedSprites.map((spriteUrl, index) => (
                  <motion.div
                    key={spriteUrl}
                    className="relative group aspect-square"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="overflow-hidden h-full w-full">
                      <Image src={spriteUrl} alt={`Extracted sprite ${index + 1}`} fill objectFit="contain" className="p-2" />
                    </Card>
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Button size="sm" variant="secondary" onClick={() => toast({ title: 'Coming Soon!', description: 'Saving individual sprites will be implemented in a future update.'})}>
                          <Save className="mr-2 h-4 w-4"/>
                          Save
                       </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
