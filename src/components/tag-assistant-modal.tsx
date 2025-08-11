
'use client';

import { useState, useTransition } from 'react';
import { suggestDanbooruTags } from '@/ai/flows/suggest-danbooru-tags';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Tags, PlusCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface TagAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAppendTags: (tags: string[]) => void;
}

export function TagAssistantModal({ isOpen, onClose, onAppendTags }: TagAssistantModalProps) {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<'headwear' | 'topwear' | 'bottomwear' | 'general'>('general');
    const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
    const [isSuggesting, startSuggestionTransition] = useTransition();
    const { toast } = useToast();

    const handleSuggestTags = () => {
        if (!query.trim()) {
            toast({ variant: 'destructive', title: 'Query Required', description: 'Please enter a description for the tags you want.' });
            return;
        }
        startSuggestionTransition(async () => {
            try {
                const result = await suggestDanbooruTags({ query, category });
                setSuggestedTags(result.suggestedTags);
                if (result.suggestedTags.length === 0) {
                     toast({ title: 'No tags found', description: 'Try a different query or category.' });
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
                        Describe what you're looking for, and the AI will suggest relevant tags to improve your prompt.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                             <Label htmlFor="tag-query">Search Query</Label>
                            <Input
                                id="tag-query"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="e.g., metal shoulder pads"
                                disabled={isSuggesting}
                            />
                        </div>
                        <div className="col-span-1 space-y-2">
                            <Label htmlFor="tag-category">Category</Label>
                             <Select
                                value={category}
                                onValueChange={(value: any) => setCategory(value)}
                                disabled={isSuggesting}
                            >
                                <SelectTrigger id="tag-category"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">General</SelectItem>
                                    <SelectItem value="headwear">Headwear</SelectItem>
                                    <SelectItem value="topwear">Topwear</SelectItem>
                                    <SelectItem value="bottomwear">Bottomwear</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>
                    </div>
                    <Button onClick={handleSuggestTags} disabled={isSuggesting} className="w-full">
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

