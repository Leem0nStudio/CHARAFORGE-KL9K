
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { useForm, Controller } from 'react-hook-form';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowRight, Wand2, Package, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getInstalledDataPacks } from '@/app/profile/actions';
import type { DataPack, Option } from '@/types/datapack';
import { cn } from '@/lib/utils';


// Sub-component for the selection carousel
function PackSelector({ packs, onSelect, onCancel }: { packs: DataPack[], onSelect: (pack: DataPack) => void, onCancel: () => void }) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        if (!emblaApi) return;
        const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
        emblaApi.on('select', onSelect);
        return () => { emblaApi.off('select', onSelect) };
    }, [emblaApi]);

    return (
        <div>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                   <Package className="h-6 w-6 text-primary"/> Select a DataPack
                </DialogTitle>
                <DialogDescription>Choose one of your installed packs to start building a prompt.</DialogDescription>
            </DialogHeader>
            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex -ml-4">
                    {packs.map(pack => (
                        <div key={pack.id} className="flex-[0_0_80%] min-w-0 pl-4">
                            <Card 
                                onClick={() => onSelect(pack)}
                                className="overflow-hidden cursor-pointer group transition-all duration-300 hover:border-primary"
                            >
                                <div className="relative aspect-video">
                                     <Image
                                        src={pack.coverImageUrl || 'https://placehold.co/600x400.png'}
                                        alt={pack.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        data-ai-hint="datapack cover image"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                    <h3 className="absolute bottom-2 left-4 text-white font-headline text-xl drop-shadow-lg">
                                        {pack.name}
                                    </h3>
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
             <div className="flex justify-center mt-4">
                {packs.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => emblaApi?.scrollTo(index)}
                        className={cn("h-2 w-2 rounded-full mx-1 transition-colors", 
                            selectedIndex === index ? 'bg-primary' : 'bg-muted'
                        )}
                    />
                ))}
            </div>
        </div>
    )
}


// Sub-component for the wizard form
function WizardForm({ pack, onPromptGenerated, onBack }: { pack: DataPack, onPromptGenerated: (prompt: string, packId: string) => void, onBack: () => void }) {
    const { control, handleSubmit, watch, setValue } = useForm();
    const formValues = watch();

     useEffect(() => {
        // Set default values for the form based on the schema
        for (const slot of pack.schema.slots) {
            if (slot.defaultOption) {
                setValue(slot.id, slot.defaultOption, { shouldValidate: true });
            }
        }
    }, [pack, setValue]);

    const disabledOptions = useMemo(() => {
        if (!pack?.schema) return {};
        
        const disabled: Record<string, string[]> = {};
        
        for (const slotId in formValues) {
            const selectedOptionValue = formValues[slotId];
            if (!selectedOptionValue) continue;

            const slot = pack.schema.slots.find(s => s.id === slotId);
            const selectedOption = slot?.options.find(o => o.value === selectedOptionValue);
            
            if (selectedOption?.exclusions) {
                for (const exclusion of selectedOption.exclusions) {
                    if (!disabled[exclusion.slotId]) {
                        disabled[exclusion.slotId] = [];
                    }
                    disabled[exclusion.slotId].push(...exclusion.optionValues);
                }
            }
        }
        return disabled;
    }, [formValues, pack]);


    const onSubmit = (data: any) => {
        if (!pack?.schema) return;
        let prompt = pack.schema.promptTemplate;
        for (const key in data) {
            const placeholder = `{${key}}`;
            prompt = prompt.replace(new RegExp(placeholder, 'g'), data[key] || '');
        }
        prompt = prompt.replace(/\{[a-zA-Z0-9_.]+\}/g, '').replace(/(\s*,\s*)+/g, ', ').replace(/^,|,$/g, '').trim();
        onPromptGenerated(prompt, pack.id);
    };

    return (
         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <DialogHeader>
                 <DialogTitle className="flex items-center gap-2">
                   <Wand2 className="h-6 w-6 text-primary"/> {pack.name} Wizard
                </DialogTitle>
                <DialogDescription>Each selection will add more detail to your final prompt.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6 max-h-[50vh] overflow-y-auto pr-3">
                {pack.schema.slots.map(slot => (
                        <div key={slot.id}>
                        <Label>{slot.label}</Label>
                            <Controller
                            name={slot.id}
                            control={control}
                            defaultValue={slot.defaultOption || ""}
                            render={({ field }) => (
                                <Select 
                                    onValueChange={field.onChange} 
                                    value={field.value}
                                >
                                    <SelectTrigger><SelectValue placeholder={slot.placeholder || "Select..."} /></SelectTrigger>
                                    <SelectContent>
                                        {slot.options.map((option: Option) => (
                                                <SelectItem 
                                                key={option.value} 
                                                value={option.value}
                                                disabled={disabledOptions[slot.id]?.includes(option.value)}
                                                >
                                                {option.label}
                                                </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        </div>
                ))}
            </div>
            
            <div className="flex justify-between items-center gap-2">
                 <Button type="button" variant="outline" onClick={onBack}>Back to Packs</Button>
                 <Button type="submit" size="lg">
                    Generate Prompt <ArrowRight className="ml-2" />
                </Button>
            </div>
        </form>
    );
}

// Main Modal Component
export function DataPackSelectorModal({ isOpen, onClose, onPromptGenerated }: { isOpen: boolean, onClose: () => void, onPromptGenerated: (prompt: string, packId: string) => void }) {
    const [packs, setPacks] = useState<DataPack[]>([]);
    const [selectedPack, setSelectedPack] = useState<DataPack | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            // Reset state when modal is closed
            setSelectedPack(null);
            return;
        }

        async function fetchPacks() {
            setIsLoading(true);
            setError(null);
            try {
                const installedPacks = await getInstalledDataPacks();
                setPacks(installedPacks);
            } catch (err: any) {
                setError("Could not load your DataPacks. Please try again.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchPacks();

    }, [isOpen]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )
        }
        if (error) {
            return (
                <Alert variant="destructive">
                    <X className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            );
        }

        if (selectedPack) {
            return <WizardForm pack={selectedPack} onPromptGenerated={onPromptGenerated} onBack={() => setSelectedPack(null)} />;
        }
        
        if (packs.length > 0) {
            return <PackSelector packs={packs} onSelect={setSelectedPack} onCancel={onClose} />
        }

        return (
             <Alert>
                <Package className="h-4 w-4" />
                <AlertTitle>No DataPacks Installed</AlertTitle>
                <AlertDescription>
                    You haven't installed any DataPacks yet. Visit the catalog to add some to your collection.
                    <Button asChild variant="link" className="p-0 h-auto ml-1"><a href="/datapacks">Go to Catalog</a></Button>
                </AlertDescription>
            </Alert>
        )
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg md:max-w-2xl">
               {renderContent()}
            </DialogContent>
        </Dialog>
    )
}
