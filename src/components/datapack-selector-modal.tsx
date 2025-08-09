
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Input } from './ui/input';


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
            <CardHeader className="p-0">
                 <div className="relative rounded-t-lg overflow-hidden bg-muted/20 max-h-[400px]">
                    <Image
                        src={pack.coverImageUrl || 'https://placehold.co/600x400.png'}
                        alt={pack.name}
                        width={600}
                        height={400}
                        className="w-full h-auto object-contain"
                        data-ai-hint="datapack cover image"
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

function PackSelector({ packs, onSelect, selectedPackId, onChoose }: {
    packs: DataPack[],
    selectedPackId: string | null,
    onSelect: (pack: DataPack) => void,
    onChoose: (pack: DataPack) => void
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
                                <Image src={pack.coverImageUrl || 'https://placehold.co/200x150.png'} alt={pack.name} fill className="object-contain" data-ai-hint="datapack cover image" />
                            </div>
                            <div className='flex-grow'>
                                <p className="font-semibold text-card-foreground">{pack.name}</p>
                                <p className="text-xs text-muted-foreground">by {pack.author}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="sm:hidden" onClick={(e) => { e.stopPropagation(); onChoose(pack); }}>
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}


function WizardForm({ pack, onPromptGenerated, onBack }: { pack: DataPack, onPromptGenerated: (prompt: string, packId: string, packName: string) => void, onBack: () => void }) {
    const { control, handleSubmit, watch, setValue } = useForm();
    const formValues = watch();

    const wizardSlots = useMemo(() => {
        // Now we can directly use the structured schema
        return pack.schema.slots || [];
    }, [pack.schema]);

    const disabledOptions = useMemo(() => {
        const disabled = new Map<string, Set<string>>();
        wizardSlots.forEach(slot => {
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
    }, [formValues, wizardSlots]);

    const onSubmit = (data: any) => {
        let prompt = pack.schema.promptTemplate || '';
        if (!prompt) {
            console.error("Prompt template is missing in the datapack schema.");
            return;
        }

        for (const key in data) {
            if(data[key]) {
               prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), data[key]);
            }
        }
        // Clean up any remaining placeholders that didn't have a value
        prompt = prompt.replace(/\{[a-zA-Z0-9_.]+\}/g, '').replace(/, ,/g, ',').replace(/, /g, ' ').replace(/,$/g, '').trim();
        onPromptGenerated(prompt, pack.id, pack.name);
    };
    
    // Set default values on initial render
    useEffect(() => {
        wizardSlots.forEach(slot => {
            if (slot.defaultOption) {
                setValue(slot.id, slot.defaultOption);
            } else if (slot.options && slot.options.length > 0) {
                 setValue(slot.id, slot.options[0].value);
            }
        });
    }, [wizardSlots, setValue]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full max-h-[80vh] sm:max-h-full">
            <DialogHeader>
                <div className="flex items-center gap-4">
                     <Button type="button" variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft />
                    </Button>
                    <DialogTitle className="flex items-center gap-2 font-headline text-2xl">
                        <Wand2 className="h-6 w-6 text-primary" /> {pack.name} Wizard
                    </DialogTitle>
                </div>
                <DialogDescription>Each selection will add more detail to your final prompt.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow my-4 pr-3 -mr-3">
                <Accordion type="multiple" className="w-full space-y-2">
                    {wizardSlots.map(slot => {
                        if (!slot) return null;
                        
                        if (slot.type === 'text') {
                             return (
                                 <div key={slot.id} className="p-4 border rounded-lg">
                                     <Label>{slot.label}</Label>
                                     <Controller
                                         name={slot.id}
                                         control={control}
                                         defaultValue=""
                                         render={({ field }) => <Input {...field} placeholder={slot.placeholder} />}
                                     />
                                 </div>
                             );
                        }

                        const selectedValue = formValues[slot.id];
                        const selectedLabel = slot.options?.find(o => o.value === selectedValue)?.label || 'None';

                        return (
                            <AccordionItem key={slot.id} value={slot.id}>
                                <AccordionTrigger>
                                    <div>
                                        <div className="text-lg font-logo tracking-wider">{slot.label}</div>
                                        <div className="text-xs text-primary font-medium">{selectedLabel}</div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <Controller
                                            name={slot.id}
                                            control={control}
                                            render={({ field }) => (
                                                <>
                                                 {slot.options?.map((option: Option) => {
                                                    const isDisabled = disabledOptions.get(slot.id)?.has(option.value);
                                                    return (
                                                         <Button
                                                            key={option.value}
                                                            type="button"
                                                            variant={field.value === option.value ? 'default' : 'secondary'}
                                                            size="sm"
                                                            onClick={() => !isDisabled && field.onChange(option.value)}
                                                            disabled={isDisabled}
                                                            className="rounded-full font-body tracking-normal"
                                                        >
                                                            {option.label}
                                                        </Button>
                                                    );
                                                 })}
                                                </>
                                            )}
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            </ScrollArea>
            <div className="flex justify-end items-center gap-2 pt-4 border-t mt-auto">
                <Button type="submit" size="lg" className="font-headline text-lg">
                    Generate Prompt <ArrowRight className="ml-2" />
                </Button>
            </div>
        </form>
    );
}

interface DataPackSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPromptGenerated: (prompt: string, packId: string, packName: string) => void;
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
            // Reset state when modal closes
            setTimeout(() => {
                setWizardPack(null);
                setSelectedPack(null);
            }, 300); // Delay reset to allow for closing animation
            return;
        }
        
        if (!isLoading && packs.length > 0 && !selectedPack && !wizardPack) {
            setSelectedPack(packs[0]);
        }

    }, [isOpen, isLoading, packs, selectedPack, wizardPack]);
    
    const handlePromptGeneratedAndClose = useCallback((prompt: string, packId: string, packName: string) => {
        onPromptGenerated(prompt, packId, packName);
        onClose();
    }, [onPromptGenerated, onClose]);
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-96">
                    <DialogHeader className="text-center mb-4"><DialogTitle>Loading Your DataPacks...</DialogTitle></DialogHeader>
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )
        }
        
        if (wizardPack) {
            return <WizardForm pack={wizardPack} onPromptGenerated={handlePromptGeneratedAndClose} onBack={() => setWizardPack(null)} />;
        }
        
        if (packs.length === 0) {
            return (
                <>
                    <DialogHeader><DialogTitle>No DataPacks Found</DialogTitle></DialogHeader>
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
        
        // Main responsive layout
        return (
             <>
                <DialogHeader className="hidden sm:block">
                    <DialogTitle className="font-headline text-3xl">Select DataPack</DialogTitle>
                    <DialogDescription>Choose one of your installed packs to start building a prompt.</DialogDescription>
                </DialogHeader>

                {/* Mobile View: List Only */}
                <div className="sm:hidden">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">Select a DataPack</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        <PackSelector
                            packs={packs}
                            onSelect={() => {}} // Not used on mobile
                            selectedPackId={null}
                            onChoose={(pack) => setWizardPack(pack)}
                        />
                    </div>
                </div>

                {/* Desktop View: Two Columns */}
                <div className="hidden sm:grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 min-h-[60vh]">
                    <div className="md:col-span-2">
                        <PackPreview pack={selectedPack} onChoose={() => {if (selectedPack) setWizardPack(selectedPack)}} />
                    </div>
                    <div className="md:col-span-1">
                        <PackSelector
                            packs={packs}
                            onSelect={setSelectedPack}
                            selectedPackId={selectedPack?.id || null}
                            onChoose={() => {}} // Not used on desktop
                        />
                    </div>
                </div>
             </>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={cn("sm:max-w-4xl", wizardPack ? "sm:max-w-xl" : "sm:max-w-4xl")}>
                {renderContent()}
            </DialogContent>
        </Dialog>
    )
}
