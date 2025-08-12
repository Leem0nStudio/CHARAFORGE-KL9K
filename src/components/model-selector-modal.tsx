
'use client';

import { useState, useEffect, useTransition } from 'react';
import Image from 'next/image';
import { getModels } from '@/app/actions/ai-models';
import type { AiModel } from '@/types/ai-model';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';


interface ModelSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (model: AiModel) => void;
    type: 'model' | 'lora';
}

export function ModelSelectorModal({ isOpen, onClose, onSelect, type }: ModelSelectorModalProps) {
    const [items, setItems] = useState<AiModel[]>([]);
    const [isLoading, startLoadingTransition] = useTransition();
    
    useEffect(() => {
        if (isOpen) {
            startLoadingTransition(async () => {
                const data = await getModels(type);
                setItems(data);
            });
        }
    }, [isOpen, type]);

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
                                {items.map(item => (
                                    <Card
                                        key={item.id}
                                        onClick={() => onSelect(item)}
                                        className="cursor-pointer overflow-hidden group transition-all hover:shadow-primary/20 hover:border-primary border-2 border-transparent"
                                    >
                                        <div className="relative aspect-square bg-muted/20">
                                            <Image src={item.coverImageUrl || 'https://placehold.co/400x400.png'} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform" sizes="(max-width: 768px) 50vw, 33vw"/>
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
