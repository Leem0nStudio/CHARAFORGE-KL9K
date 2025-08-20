
'use client';

import { useState, useEffect, useTransition } from 'react';
import type { AiModel } from '@/types/ai-model';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { MediaDisplay } from './media-display';
import { Separator } from './ui/separator';


interface ModelSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (model: AiModel) => void;
    type: 'model' | 'lora' | 'text';
    models: AiModel[];
    isLoading: boolean;
}

export function ModelSelectorModal({ isOpen, onClose, onSelect, type, models, isLoading }: ModelSelectorModalProps) {
    const title = type === 'model' ? 'Select Base Model' : type === 'lora' ? 'Select LoRA' : 'Select Text Model';
    const description = `Choose a ${type} to use for generation.`;

    const renderSkeletons = () => (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                 <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <CardContent className="p-3">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="flex-grow flex flex-col min-h-0">
                    {isLoading && type !== 'text' ? renderSkeletons() : (
                         <>
                            {models.length === 0 ? (
                                <div className="flex-grow flex items-center justify-center">
                                <p className="text-muted-foreground">No {type}s available to select.</p>
                                </div>
                            ) : (
                                <ScrollArea className="flex-grow pr-4 -mr-4">
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {models.map(item => (
                                            <Card
                                                key={item.id}
                                                onClick={() => onSelect(item)}
                                                className="cursor-pointer overflow-hidden group transition-all hover:shadow-primary/20 hover:border-primary border-2 border-transparent flex flex-col bg-card-highlight"
                                            >
                                                <div className="relative aspect-[4/3] bg-muted/20">
                                                    <MediaDisplay 
                                                        url={item.coverMediaUrl} 
                                                        type={item.coverMediaType} 
                                                        alt={item.name} 
                                                        className="object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                </div>
                                                <CardContent className="p-3 flex-grow flex flex-col">
                                                    <p className="font-semibold truncate">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{item.hf_id}</p>
                                                    {item.triggerWords && item.triggerWords.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {item.triggerWords.slice(0, 2).map(word => <Badge key={word} variant="outline">{word}</Badge>)}
                                                            {item.triggerWords.length > 2 && <Badge variant="outline">...</Badge>}
                                                        </div>
                                                    )}
                                                    {item.versions && item.versions.length > 1 && (
                                                        <div className="mt-auto pt-2">
                                                            <Separator className="my-2"/>
                                                            <h4 className="text-xs font-semibold text-muted-foreground mb-1">Versions:</h4>
                                                            <div className="flex flex-wrap gap-1">
                                                                {item.versions.slice(0, 3).map(v => (
                                                                    <Badge key={v.id} variant="secondary">{v.name}</Badge>
                                                                ))}
                                                                {item.versions.length > 3 && <Badge variant="secondary">...</Badge>}
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
