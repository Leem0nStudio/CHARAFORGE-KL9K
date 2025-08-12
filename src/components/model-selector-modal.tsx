
'use client';

import { useState, useEffect, useTransition } from 'react';
import type { AiModel } from '@/types/ai-model';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { MediaDisplay } from './media-display';


interface ModelSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (model: AiModel) => void;
    type: 'model' | 'lora';
    models: AiModel[];
}

export function ModelSelectorModal({ isOpen, onClose, onSelect, type, models }: ModelSelectorModalProps) {
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        // The loading state is now managed by the parent, but we can have a local one for transitions.
        setIsLoading(!models);
    }, [models]);

    const title = type === 'model' ? 'Select Base Model' : 'Select LoRA';
    const description = `Choose a ${type} to use for image generation.`;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col h-full">
                    {isLoading ? (
                        <div className="flex-grow flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <ScrollArea className="flex-grow pr-4 -mr-4">
                             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {models.map(item => (
                                    <Card
                                        key={item.id}
                                        onClick={() => onSelect(item)}
                                        className="cursor-pointer overflow-hidden group transition-all hover:shadow-primary/20 hover:border-primary border-2 border-transparent"
                                    >
                                        <div className="relative aspect-square bg-muted/20">
                                            <MediaDisplay 
                                                url={item.coverMediaUrl} 
                                                type={item.coverMediaType} 
                                                alt={item.name} 
                                                className="object-cover group-hover:scale-105 transition-transform"
                                            />
                                        </div>
                                        <CardContent className="p-3">
                                            <p className="font-semibold truncate">{item.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{item.hf_id}</p>
                                            {item.triggerWords && item.triggerWords.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {item.triggerWords.slice(0, 2).map(word => <Badge key={word} variant="outline">{word}</Badge>)}
                                                    {item.triggerWords.length > 2 && <Badge variant="outline">...</Badge>}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
