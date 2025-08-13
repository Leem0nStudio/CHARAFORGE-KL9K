
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { getInstalledDataPacks } from '@/app/actions/datapacks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, Wand2, Package, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { DataPack, Option, Slot } from '@/types/datapack';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import Link from 'next/link';
import { DataPackCard } from './datapack/datapack-card';


function OptionSelectModal({
    isOpen,
    onClose,
    slot,
    currentValue,
    onSelect,
    disabledOptions,
}: {
    isOpen: boolean;
    onClose: () => void;
    slot: Slot;
    currentValue: string;
    onSelect: (value: string) => void;
    disabledOptions: Set<string>;
}) {
    if (!slot) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">{slot.label}</DialogTitle>
                    <DialogDescription>Select an option for this category.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                     <div className="flex flex-wrap gap-2 pt-2">
                         {slot.options?.map((option: Option) => {
                             const isDisabled = disabledOptions.has(option.value);
                             return (
                                 <Button
                                     key={option.value}
                                     type="button"
                                     variant={currentValue === option.value ? 'default' : 'secondary'}
                                     onClick={() => {
                                         if (!isDisabled) {
                                            onSelect(option.value);
                                            onClose();
                                         }
                                     }}
                                     disabled={isDisabled}
                                     className="rounded-full"
                                 >
                                     {option.label}
                                 </Button>
                             );
                         })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function WizardGrid({ pack, onPromptGenerated, onBack }: { pack: DataPack, onPromptGenerated: (prompt: string, packName: string, tags: string[], packId: string) => void, onBack: () => void }) {
    const { control, handleSubmit, watch, setValue } = useForm();
    const formValues = watch();

    const [activeSlot, setActiveSlot] = useState<Slot | null>(null);

    const wizardSlots = useMemo(() => pack.schema.slots.filter(slot => !slot.isLocked), [pack.schema.slots]);

    const disabledOptions = useMemo(() => {
        const disabled = new Map<string, Set<string>>();
        pack.schema.slots.forEach(slot => {
            const selectedValue = formValues[slot.id];
            if (!selectedValue) return;

            const selectedOption = slot.options?.find(opt => opt.value === selectedValue);
            if (!selectedOption || !selectedOption.exclusions) return;

            selectedOption.exclusions.forEach(exclusion => {
                if (!disabled.has(exclusion.slotId)) {
                    disabled.set(exclusion.slotId, new Set());
                }
                const disabledSet = disabled.get(exclusion.slotId)!;
                exclusion.optionValues.forEach(val => disabledSet.add(val));
            });
        });
        return disabled;
    }, [formValues, pack.schema.slots]);

    useEffect(() => {
        pack.schema.slots.forEach(slot => {
            if (slot.defaultOption) {
                setValue(slot.id, slot.defaultOption);
            } else if (slot.type === 'select' && slot.options && slot.options.length > 0) {
                 setValue(slot.id, slot.options[0].value);
            }
        });
    }, [pack.schema.slots, setValue]);

    const onSubmit = (data: any) => {
        let prompt = pack.schema.promptTemplate || '';
        
        const fullData = { ...data };
        pack.schema.slots.forEach(slot => {
            if (slot.isLocked && slot.defaultOption) {
                fullData[slot.id] = slot.defaultOption;
            }
        });
        
        const tags: string[] = [];
        for (const key in fullData) {
            if (fullData[key]) {
               prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), fullData[key]);
               tags.push(fullData[key]);
            }
        }
        
        prompt = prompt.replace(/\{[a-zA-Z0-9_.]+\}/g, '').replace(/, ,/g, ',').replace(/, /g, ' ').replace(/,$/g, '').trim();
        onPromptGenerated(prompt, pack.name, tags, pack.id);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full max-h-[80vh] sm:max-h-full">
             <OptionSelectModal
                isOpen={!!activeSlot}
                onClose={() => setActiveSlot(null)}
                slot={activeSlot!}
                currentValue={activeSlot ? formValues[activeSlot.id] : ''}
                onSelect={(value) => activeSlot && setValue(activeSlot.id, value)}
                disabledOptions={activeSlot ? (disabledOptions.get(activeSlot.id) || new Set()) : new Set()}
            />
            {/* The DialogHeader is now part of the parent so it's always present */}
            <ScrollArea className="flex-grow my-4 pr-3 -mr-3">
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {wizardSlots.map(slot => {
                        const selectedValue = formValues[slot.id];
                        const selectedOption = slot.options?.find(o => o.value === selectedValue);

                        return (
                            <Card
                                key={slot.id}
                                onClick={() => setActiveSlot(slot)}
                                className="cursor-pointer hover:bg-muted/50 transition-colors h-full flex flex-col"
                            >
                                <CardHeader className="p-3">
                                    <CardTitle className="text-base font-logo tracking-wider">{slot.label}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-0 flex-grow">
                                     <p className="text-sm text-primary font-semibold truncate">{selectedOption?.label || 'None'}</p>
                                </CardContent>
                            </Card>
                        )
                    })}
                 </div>
            </ScrollArea>
            <DialogFooter className="flex-none pt-4 border-t">
                <Button type="button" variant="ghost" onClick={onBack}>
                    <ArrowLeft className="mr-2" /> Back to Packs
                </Button>
                <Button type="submit" size="lg" className="w-full sm:w-auto font-headline text-lg">
                    Generate Prompt <ArrowRight className="ml-2" />
                </Button>
            </DialogFooter>
        </form>
    )
}

function PackGallery({ 
    onChoosePack,
}: { 
    onChoosePack: (pack: DataPack) => void,
}) {
    const [isLoading, setIsLoading] = useState(true);
    const [packs, setPacks] = useState<DataPack[]>([]);

    useEffect(() => {
        const loadPacks = async () => {
            setIsLoading(true);
            try {
                const installedPacks = await getInstalledDataPacks();
                setPacks(installedPacks);
            } catch (error) {
                console.error("Failed to load installed datapacks for selector", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadPacks();
    }, []);

    if (isLoading) {
        return (
            <div className="flex-grow flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (packs.length === 0) {
        return (
            <div className="flex flex-col h-full items-center justify-center">
                <Alert className="mt-4">
                    <Package className="h-4 w-4" />
                    <AlertTitle>Your collection is empty!</AlertTitle>
                    <AlertDescription>
                        Visit the catalog to add some creative packs.
                        <Button asChild variant="link" className="p-0 h-auto ml-1"><Link href="/datapacks">Go to Catalog</Link></Button>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }
    
    return (
        <div className="flex flex-col h-full">
             <ScrollArea className="flex-grow my-4 pr-4 -mr-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {packs.map(pack => (
                       <div key={pack.id} onClick={() => onChoosePack(pack)} className="cursor-pointer">
                           <DataPackCard pack={pack} isCompact />
                       </div>
                    ))}
                 </div>
            </ScrollArea>
             <DialogFooter className="pt-4 border-t">
                 <p className="text-sm text-muted-foreground mr-auto">Need more options?</p>
                 <Button asChild variant="outline">
                    <Link href="/datapacks">Browse Full Catalog</Link>
                </Button>
            </DialogFooter>
        </div>
    );
}


interface DataPackSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPromptGenerated: (prompt: string, packName: string, tags: string[], packId: string) => void;
}


export function DataPackSelectorModal({ 
    isOpen, 
    onClose, 
    onPromptGenerated,
}: DataPackSelectorModalProps) {
    const [wizardPack, setWizardPack] = useState<DataPack | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setWizardPack(null);
            }, 300);
        }
    }, [isOpen]);
    
    const handlePromptGeneratedAndClose = useCallback((prompt: string, packName: string, tags: string[], packId: string) => {
        onPromptGenerated(prompt, packName, tags, packId);
        onClose();
    }, [onPromptGenerated, onClose]);
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={cn("max-h-[90vh] flex flex-col", wizardPack ? "sm:max-w-4xl" : "sm:max-w-5xl")}>
                <DialogHeader>
                    {wizardPack ? (
                         <DialogTitle className="flex items-center gap-2 font-headline text-2xl">
                            <Wand2 className="h-6 w-6 text-primary" /> {wizardPack.name} Wizard
                        </DialogTitle>
                    ) : (
                        <DialogTitle className="font-headline text-3xl">Select DataPack</DialogTitle>
                    )}
                     <DialogDescription>
                        {wizardPack 
                            ? "Click on any card to change its selection."
                            : "Choose one of your installed packs to start building a prompt."
                        }
                    </DialogDescription>
                </DialogHeader>

                {wizardPack ? (
                    <WizardGrid pack={wizardPack} onPromptGenerated={handlePromptGeneratedAndClose} onBack={() => setWizardPack(null)} />
                ) : (
                    <PackGallery onChoosePack={setWizardPack} />
                )}
            </DialogContent>
        </Dialog>
    )
}
