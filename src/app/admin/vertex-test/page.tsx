
'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { runVertexTest } from './actions';


export default function VertexTestPage() {
    const { toast } = useToast();
    const [isGenerating, startTransition] = useTransition();
    const [prompt, setPrompt] = useState('A majestic dragon soaring over a mystical forest at dawn, cinematic lighting.');
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleRunTest = () => {
        setError(null);
        setGeneratedImageUrl(null);
        startTransition(async () => {
            const result = await runVertexTest(prompt);
            if (result.success) {
                toast({ title: 'Success!', description: 'Image generated from Vertex AI.' });
                setGeneratedImageUrl(result.imageUrl as string);
            } else {
                toast({ variant: 'destructive', title: 'Test Failed', description: result.message });
                setError(result.message);
            }
        });
    }

    return (
        <AdminPageLayout title="Vertex AI Endpoint Test">
            <Card>
                <CardHeader>
                    <CardTitle>Direct Inference Test</CardTitle>
                    <CardDescription>
                        This page calls your Vertex AI endpoint directly, bypassing Genkit abstractions.
                        This is for debugging the connection and payload format.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="prompt">Image Prompt</Label>
                        <Textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="min-h-[100px]"
                            placeholder="Enter a prompt for the model..."
                        />
                    </div>
                    <Button onClick={handleRunTest} disabled={isGenerating}>
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 animate-spin" />
                                Running Test...
                            </>
                        ) : (
                            <>
                                <Wand2 className="mr-2" />
                                Execute Test
                            </>
                        )}
                    </Button>

                    <div className="mt-6">
                        <h3 className="font-semibold mb-2">Result</h3>
                        <div className="w-full aspect-square max-w-lg mx-auto border-2 border-dashed rounded-lg bg-muted/50 flex items-center justify-center p-4">
                             {isGenerating && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
                             {error && (
                                 <Alert variant="destructive" className="text-left">
                                      <AlertCircle className="h-4 w-4" />
                                      <AlertTitle>Error</AlertTitle>
                                      <AlertDescription>
                                         <p>{error}</p>
                                      </AlertDescription>
                                  </Alert>
                             )}
                             {generatedImageUrl && (
                                <Image
                                    src={generatedImageUrl}
                                    alt="Generated from Vertex AI"
                                    width={1024}
                                    height={1024}
                                    className="object-contain"
                                />
                             )}
                              {!isGenerating && !error && !generatedImageUrl && (
                                <p className="text-muted-foreground">The generated image will appear here.</p>
                              )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </AdminPageLayout>
    );
}
