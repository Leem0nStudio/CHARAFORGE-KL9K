
'use client';

import { useState, useTransition, useEffect } from 'react';
import { suggestDanbooruTags } from '@/ai/flows/danbooru-tag-suggestion/flow';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Tags, PlusCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface TagAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAppendTags: (tags: string[]) => void;
    currentDescription: string;
}

export function TagAssistantModal({ isOpen, onClose, onAppendTags, currentDescription }: TagAssistantModalProps) {
    const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
    const [isSuggesting, startSuggestionTransition] = useTransition();
    const { toast } = useToast();

    // Reset state when modal is closed
    useEffect(() => {
        if (!isOpen) {
            setSuggestedTags([]);
        }
    }, [isOpen]);

    const handleSuggestTags = () => {
        if (!currentDescription.trim()) {
            toast({ variant: 'destructive', title: 'Description Required', description: 'Please enter a character description before using the assistant.' });
            return;
        }
        startSuggestionTransition(async () => {
            try {
                const result = await suggestDanbooruTags({ description: currentDescription });
                setSuggestedTags(result.suggestedTags);
                if (result.suggestedTags.length === 0) {
                     toast({ title: 'No new tags found', description: 'Try adding more details to your description.' });
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : "An unknown error occurred.";
                toast({ variant: 'destructive', title: 'Suggestion Failed', description: message });
            }
        });
    }

    const handleAddTag = (tag: string) => {
        onAppendTags([tag]);
        setSuggestedTags(prev => prev.filter(t => t !== tag));
        toast({ title: 'Tag Added!', description: `"${tag}" was appended to your description.`});
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-headline text-2xl">
                        <Tags className="text-primary"/> Tag Assistant
                    </DialogTitle>
                    <DialogDescription>
                        Let the AI analyze your prompt and suggest relevant tags to improve image generation quality.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <h4 className="font-semibold mb-2 text-sm">Analyzing Description:</h4>
                        <p className="text-sm text-muted-foreground border p-2 rounded-md max-h-24 overflow-y-auto bg-muted/50">
                            {currentDescription || "No description provided."}
                        </p>
                    </div>

                    <Button onClick={handleSuggestTags} disabled={isSuggesting || !currentDescription} className="w-full">
                        {isSuggesting && <Loader2 className="mr-2 animate-spin" />}
                        Suggest Tags
                    </Button>
                </div>

                {suggestedTags.length > 0 && (
                    <div className="space-y-3">
                         <Separator />
                        <h4 className="font-semibold">Suggestions</h4>
                        <div className="flex flex-wrap gap-2">
                            {suggestedTags.map(tag => (
                                <Badge
                                    key={tag}
                                    variant="outline"
                                    onClick={() => handleAddTag(tag)}
                                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                >
                                    <PlusCircle className="mr-2 h-3 w-3" />
                                    {tag.replace(/_/g, ' ')}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
                 <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
