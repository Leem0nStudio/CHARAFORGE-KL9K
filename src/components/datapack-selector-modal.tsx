

'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { getInstalledDataPacks } from '@/app/actions/datapacks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, Wand2, Package, ArrowLeft, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { DataPack, Option, Slot } from '@/types/datapack';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import Link from 'next/link';
import { Badge } from './ui/badge';
import { getSlotCategory } from '@/lib/app-config';

function DataPackInfoDialog({ pack, isOpen, onClose }: { pack: DataPack | null, isOpen: boolean, onClose: () => void }) {
    if (!pack) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">{pack.name}</DialogTitle>
                    <DialogDescription>{pack.description}</DialogDescription>
                </DialogHeader>
                 <ScrollArea className="max-h-[60vh] -mx-6 px-6 py-4">
                     <div className="space-y-6">
                        <div>
                            <h4 className="font-semibold mb-2">Prompt Template</h4>
                            <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground font-mono break-words">
                                {pack.schema.promptTemplate}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Available Slots</h4>
                             <div className="flex flex-wrap gap-2">
                                 {pack.schema.slots.map((slot) => (
                                    <Badge 
                                        key={slot.id} 
                                        variant="outline"
                                        data-category={getSlotCategory(slot.id)}
                                    >
                                        {slot.label}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


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
    const { handleSubmit, watch, setValue } = useForm();
    const formValues = watch();

    const [activeSlot, setActiveSlot] = useState<Slot | null>(null);

    const wizardSlots = pack.schema.slots.filter(slot => !slot.isLocked);

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
        
        const promptTags: string[] = [];
        for (const key in fullData) {
            if (fullData[key]) {
               prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), fullData[key]);
               promptTags.push(fullData[key]);
            }
        }
        
        prompt = prompt.replace(/\{[a-zA-Z0-9_.]+\}/g, '').replace(/, ,/g, ',').replace(/, /g, ' ').replace(/,$/g, '').trim();
        
        // Combine prompt keywords with the pack's high-level tags
        const allTags = [...(pack.tags || []), ...promptTags];

        onPromptGenerated(prompt, pack.name, allTags, pack.id);
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-headline text-2xl">
                    <Wand2 className="h-6 w-6 text-primary" /> {pack.name} Wizard
                </DialogTitle>
                <DialogDescription>
                    Click on any card to change its selection.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-grow min-h-0">
                 <OptionSelectModal
                    isOpen={!!activeSlot}
                    onClose={() => setActiveSlot(null)}
                    slot={activeSlot!}
                    currentValue={activeSlot ? formValues[activeSlot.id] : ''}
                    onSelect={(value) => activeSlot && setValue(activeSlot.id, value)}
                    disabledOptions={new Set()}
                />
                <ScrollArea className="flex-grow my-4 pr-3 -mr-3">
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {wizardSlots.map(slot => {
                            const selectedValue = formValues[slot.id];
                            const selectedOption = slot.options?.find(o => o.value === selectedValue);

                            return (
                                <Card
                                    key={slot.id}
                                    onClick={() => setActiveSlot(slot)}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors h-full flex flex-col"
                                >
                                    <div className="p-3 pb-0">
                                        <div className="text-sm text-muted-foreground">{slot.label}</div>
                                    </div>
                                    <div className="p-3 flex-grow flex items-center">
                                         <p className="text-base text-primary font-semibold whitespace-normal">{selectedOption?.label || 'None'}</p>
                                    </div>
                                </Card>
                            )
                        })}
                     </div>
                </ScrollArea>
                <DialogFooter className="flex-none pt-4 border-t mt-auto">
                    <Button type="button" variant="ghost" onClick={onBack}>
                        <ArrowLeft className="mr-2" /> Back
                    </Button>
                    <Button type="submit" size="lg" className="w-full sm:w-auto font-headline text-lg">
                        Generate Prompt <ArrowRight className="ml-2" />
                    </Button>
                </DialogFooter>
            </form>
        </>
    )
}

function PackGallery({ 
    onChoosePack,
}: { 
    onChoosePack: (pack: DataPack) => void,
}) {
    const [isLoading, setIsLoading] = useState(true);
    const [packs, setPacks] = useState<DataPack[]>([]);
    const [infoPack, setInfoPack] = useState<DataPack | null>(null);

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
        <>
            <DataPackInfoDialog pack={infoPack} isOpen={!!infoPack} onClose={() => setInfoPack(null)} />
             <div className="flex-grow min-h-0 py-4">
                <ScrollArea className="h-full pr-4 -mr-4">
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {packs.map(pack => (
                           <Card key={pack.id} className="overflow-hidden group relative aspect-square">
                                <Image
                                    src={pack.coverImageUrl || 'https://placehold.co/600x600.png'}
                                    alt={pack.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    data-ai-hint="datapack cover image"
                                />
                                 <div className="absolute inset-0 bg-black/50 flex flex-col justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div />
                                     <div className="flex flex-col items-center justify-center gap-2">
                                         <Button type="button" size="sm" className="w-full" onClick={() => onChoosePack(pack)}>
                                            <Wand2 className="mr-2 h-4 w-4"/> Use
                                        </Button>
                                        <Button type="button" variant="secondary" size="sm" className="w-full" onClick={() => setInfoPack(pack)}>
                                            <Info className="mr-2 h-4 w-4"/> Info
                                        </Button>
                                    </div>
                                    <div>
                                         <CardTitle className="text-white font-bold drop-shadow-lg">{pack.name}</CardTitle>
                                    </div>
                                </div>
                                {/* Visible title when not hovering */}
                                 <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none group-hover:opacity-0 transition-opacity">
                                    <CardTitle className="text-white font-bold drop-shadow-lg">{pack.name}</CardTitle>
                                </div>
                           </Card>
                        ))}
                     </div>
                </ScrollArea>
             </div>
        </>
    );
}


interface DataPackSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPromptGenerated: (prompt: string, packName: string, tags: string[], packId: string) => void;
    initialPack?: DataPack | null;
}


export function DataPackSelectorModal({ 
    isOpen, 
    onClose, 
    onPromptGenerated,
    initialPack,
}: DataPackSelectorModalProps) {
    const [wizardPack, setWizardPack] = useState<DataPack | null>(null);

    useEffect(() => {
        if (isOpen && initialPack) {
            setWizardPack(initialPack);
        }
        if (!isOpen) {
            setTimeout(() => {
                setWizardPack(null);
            }, 300);
        }
    }, [isOpen, initialPack]);
    
    const handlePromptGeneratedAndClose = useCallback((prompt: string, packName: string, tags: string[], packId: string) => {
        onPromptGenerated(prompt, packName, tags, packId);
        onClose();
    }, [onPromptGenerated, onClose]);
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={cn("max-h-[90vh] flex flex-col", wizardPack ? "sm:max-w-3xl" : "sm:max-w-4xl h-full sm:h-auto")}>
                {wizardPack ? (
                    <WizardGrid pack={wizardPack} onPromptGenerated={handlePromptGeneratedAndClose} onBack={() => setWizardPack(null)} />
                ) : (
                    <>
                    <div className="flex-shrink-0">
                        <DialogHeader>
                            <DialogTitle className="font-headline text-3xl">Select DataPack</DialogTitle>
                            <DialogDescription>
                                Choose one of your installed packs to start building a prompt.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    
                    <PackGallery onChoosePack={setWizardPack} />
                    
                     <div className="flex-shrink-0 pt-4 border-t">
                        <DialogFooter>
                            <p className="text-sm text-muted-foreground mr-auto">Need more options?</p>
                             <Button asChild variant="outline">
                                <Link href="/datapacks">Browse Full Catalog</Link>
                            </Button>
                        </DialogFooter>
                    </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
