
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
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

function PackPreview({ pack, onChoose }: { pack: DataPack | null, onChoose: () => void }) {
    if (!pack) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg bg-card/50">
                <Package className="h-16 w-16 mb-4 text-primary" />
                <h3 className="text-xl font-headline tracking-wider">Select a DataPack</h3>
                <p>Choose a pack from the list to see its details and use the wizard.</p>
            </div>
        )
    }

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="p-0 relative">
                 <div className="relative rounded-t-lg overflow-hidden bg-muted/20 max-h-[400px]">
                    <Image
                        src={pack.coverImageUrl || 'https://placehold.co/600x400.png'}
                        alt={pack.name}
                        width={600}
                        height={400}
                        className="w-full h-auto object-contain"
                        data-ai-hint="datapack cover image"
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                </div>
            </CardHeader>
            <CardContent className="p-6 flex-grow flex flex-col">
                <h2 className="text-3xl font-headline tracking-wider">{pack.name}</h2>
                <p className="text-muted-foreground">by {pack.author}</p>
                <Separator className="my-4" />
                <ScrollArea className="flex-grow pr-4 max-h-[200px]">
                    <p className="text-sm text-muted-foreground">{pack.description}</p>
                </ScrollArea>
            </CardContent>
            <CardFooter>
                 <Button onClick={onChoose} className="w-full font-headline text-lg" size="lg">
                    Use this Pack <ArrowRight className="ml-2" />
                </Button>
            </CardFooter>
        </Card>
    )
}

function PackSelector({ packs, onSelect, selectedPackId }: {
    packs: DataPack[],
    selectedPackId: string | null,
    onSelect: (pack: DataPack) => void
}) {
    return (
        <div className="flex flex-col h-full">
            <h3 className="font-headline text-xl mb-4 text-center">Your Installed Packs</h3>
            <ScrollArea className="flex-grow pr-4 -mr-4">
                <div className="space-y-2">
                    {packs.map(pack => (
                        <div
                            key={pack.id}
                            onClick={() => onSelect(pack)}
                            onKeyDown={(e) => e.key === 'Enter' && onSelect(pack)}
                            role="button"
                            tabIndex={0}
                            className={cn(
                                "w-full text-left p-2 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 cursor-pointer",
                                selectedPackId === pack.id
                                    ? "bg-primary/20 border-primary shadow-md"
                                    : "bg-muted/50 border-transparent hover:bg-muted"
                            )}
                        >
                             <div className="relative w-16 h-12 rounded-md overflow-hidden shrink-0 bg-muted/20">
                                <Image src={pack.coverImageUrl || 'https://placehold.co/200x150.png'} alt={pack.name} fill className="object-contain" data-ai-hint="datapack cover image" sizes="64px" />
                            </div>
                            <div>
                                <p className="font-semibold text-card-foreground">{pack.name}</p>
                                <p className="text-xs text-muted-foreground">by {pack.author}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
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
        
        // Combine form data with locked slot data for prompt generation
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
            <DialogHeader>
                <div className="flex items-center gap-4">
                     <Button type="button" variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft />
                    </Button>
                    <DialogTitle className="flex items-center gap-2 font-headline text-2xl">
                        <Wand2 className="h-6 w-6 text-primary" /> {pack.name} Wizard
                    </DialogTitle>
                </div>
                <DialogDescription>Click on any card to change its selection.</DialogDescription>
            </DialogHeader>
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
                 <Button type="submit" size="lg" className="w-full sm:w-auto font-headline text-lg">
                    Generate Prompt <ArrowRight className="ml-2" />
                </Button>
            </DialogFooter>
        </form>
    )
}

interface DataPackSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPromptGenerated: (prompt: string, packName: string, tags: string[], packId: string) => void;
    installedPacks: DataPack[];
    isLoading: boolean;
}


export function DataPackSelectorModal({ 
    isOpen, 
    onClose, 
    onPromptGenerated,
    installedPacks: packs,
    isLoading, 
}: DataPackSelectorModalProps) {
    const [selectedPack, setSelectedPack] = useState<DataPack | null>(null);
    const [wizardPack, setWizardPack] = useState<DataPack | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setWizardPack(null);
                setSelectedPack(null);
            }, 300);
            return;
        }
        
        if (!isLoading && packs.length > 0 && !selectedPack && !wizardPack) {
            setSelectedPack(packs[0]);
        }

    }, [isOpen, isLoading, packs, selectedPack, wizardPack]);
    
    const handlePromptGeneratedAndClose = useCallback((prompt: string, packName: string, tags: string[], packId: string) => {
        onPromptGenerated(prompt, packName, tags, packId);
        onClose();
    }, [onPromptGenerated, onClose]);
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-96">
                    <DialogHeader className="text-center mb-4">
                        <DialogTitle>Loading Your DataPacks...</DialogTitle>
                        <DialogDescription>Please wait while we fetch your installed packs.</DialogDescription>
                    </DialogHeader>
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )
        }
        
        if (wizardPack) {
            return <WizardGrid pack={wizardPack} onPromptGenerated={handlePromptGeneratedAndClose} onBack={() => setWizardPack(null)} />;
        }
        
        if (packs.length === 0) {
            return (
                <>
                    <DialogHeader>
                        <DialogTitle>No DataPacks Found</DialogTitle>
                        <DialogDescription>You haven't installed any DataPacks yet. Visit the catalog to add some.</DialogDescription>
                    </DialogHeader>
                    <Alert>
                        <Package className="h-4 w-4" />
                        <AlertTitle>No DataPacks Installed</AlertTitle>
                        <AlertDescription>
                            You haven't installed any DataPacks yet. Visit the catalog to add some to your collection.
                            <Button asChild variant="link" className="p-0 h-auto ml-1"><Link href="/datapacks">Go to Catalog</Link></Button>
                        </AlertDescription>
                    </Alert>
                </>
            )
        }
        
        return (
             <>
                <DialogHeader>
                    <DialogTitle className="font-headline text-3xl">Select DataPack</DialogTitle>
                    <DialogDescription>Choose one of your installed packs to start building a prompt.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 min-h-[60vh]">
                    <div className="md:col-span-2">
                        <PackPreview pack={selectedPack} onChoose={() => {if (selectedPack) setWizardPack(selectedPack)}} />
                    </div>
                    <div className="md:col-span-1">
                        <PackSelector
                            packs={packs}
                            onSelect={setSelectedPack}
                            selectedPackId={selectedPack?.id || null}
                        />
                    </div>
                </div>
             </>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={cn("sm:max-w-4xl", wizardPack ? "sm:max-w-2xl" : "sm:max-w-5xl")}>
                {renderContent()}
            </DialogContent>
        </Dialog>
    )
}
