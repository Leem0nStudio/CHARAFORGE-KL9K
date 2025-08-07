
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowRight, Wand2, Package, X, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getInstalledDataPacks } from '@/app/profile/actions';
import type { DataPack, Option } from '@/types/datapack';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import Link from 'next/link';


function PackPreview({ pack }: { pack: DataPack | null }) {
    if (!pack) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg bg-card/50">
                <Package className="h-16 w-16 mb-4 text-primary" />
                <h3 className="text-xl font-headline tracking-wider">Select a DataPack</h3>
                <p>Choose a pack from the list to see its details.</p>
            </div>
        )
    }

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="p-0">
                <div className="relative aspect-video rounded-t-lg overflow-hidden">
                    <Image
                        src={pack.coverImageUrl || 'https://placehold.co/600x400.png'}
                        alt={pack.name}
                        fill
                        className="object-cover"
                        data-ai-hint="datapack cover image"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
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
        </Card>
    )
}

function PackSelector({ packs, onSelect, onChoose, selectedPackId }: {
    packs: DataPack[],
    selectedPackId: string | null,
    onSelect: (pack: DataPack) => void,
    onChoose: () => void,
}) {
    return (
        <div className="flex flex-col h-full">
            <h3 className="font-headline text-xl mb-4 text-center">Choose a DataPack</h3>
            <ScrollArea className="flex-grow pr-4 -mr-4">
                <div className="space-y-2">
                    {packs.map(pack => (
                        <button
                            key={pack.id}
                            onClick={() => onSelect(pack)}
                            className={cn(
                                "w-full text-left p-2 rounded-lg border-2 transition-all duration-200 flex items-center gap-3",
                                selectedPackId === pack.id
                                    ? "bg-primary/20 border-primary shadow-md"
                                    : "bg-muted/50 border-transparent hover:bg-muted"
                            )}
                        >
                             <div className="relative w-16 h-12 rounded-md overflow-hidden shrink-0 bg-muted">
                                <Image src={pack.coverImageUrl || 'https://placehold.co/200x150.png'} alt={pack.name} fill className="object-cover" data-ai-hint="datapack cover image" />
                            </div>
                            <div>
                                <p className="font-semibold text-card-foreground">{pack.name}</p>
                                <p className="text-xs text-muted-foreground">by {pack.author}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </ScrollArea>
            <div className="mt-auto pt-4">
                <Button onClick={onChoose} className="w-full font-headline text-lg" size="lg" disabled={!selectedPackId}>
                    Use this Pack <ArrowRight className="ml-2" />
                </Button>
            </div>
        </div>
    )
}


function WizardForm({ pack, onPromptGenerated }: { pack: DataPack, onPromptGenerated: (prompt: string, packId: string) => void }) {
    const { control, handleSubmit, watch, setValue } = useForm();
    const formValues = watch();

    useEffect(() => {
        for (const slot of pack.schema.slots) {
            if (slot.defaultOption) {
                setValue(slot.id, slot.defaultOption, { shouldValidate: true });
            }
        }
    }, [pack, setValue]);

    const disabledOptions = useMemo(() => {
        const disabled: Record<string, string[]> = {};
        for (const slotId in formValues) {
            const selectedOptionValue = formValues[slotId];
            if (!selectedOptionValue) continue;
            const slot = pack.schema.slots.find(s => s.id === slotId);
            const selectedOption = slot?.options.find(o => o.value === selectedOptionValue);
            if (selectedOption?.exclusions) {
                for (const exclusion of selectedOption.exclusions) {
                    if (!disabled[exclusion.slotId]) disabled[exclusion.slotId] = [];
                    disabled[exclusion.slotId].push(...exclusion.optionValues);
                }
            }
        }
        return disabled;
    }, [formValues, pack]);

    const onSubmit = (data: any) => {
        let prompt = pack.schema.promptTemplate;
        for (const key in data) {
            prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), data[key] || '');
        }
        prompt = prompt.replace(/\{[a-zA-Z0-9_.]+\}/g, '').replace(/(\s*,\s*)+/g, ', ').replace(/^,|,$/g, '').trim();
        onPromptGenerated(prompt, pack.id);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-headline text-2xl">
                    <Wand2 className="h-6 w-6 text-primary" /> {pack.name} Wizard
                </DialogTitle>
                <DialogDescription>Each selection will add more detail to your final prompt.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[50vh] pr-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                    {pack.schema.slots.map(slot => (
                        <div key={slot.id}>
                            <Label>{slot.label}</Label>
                            <Controller
                                name={slot.id}
                                control={control}
                                defaultValue={slot.defaultOption || ""}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
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
            </ScrollArea>
            <div className="flex justify-end items-center gap-2 pt-4">
                <Button type="submit" size="lg" className="font-headline text-lg">
                    Generate Prompt <ArrowRight className="ml-2" />
                </Button>
            </div>
        </form>
    );
}

export function DataPackSelectorModal({ isOpen, onClose, onPromptGenerated }: { isOpen: boolean, onClose: () => void, onPromptGenerated: (prompt: string, packId: string) => void }) {
    const [packs, setPacks] = useState<DataPack[]>([]);
    const [selectedPack, setSelectedPack] = useState<DataPack | null>(null);
    const [wizardPack, setWizardPack] = useState<DataPack | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setWizardPack(null);
            setSelectedPack(null);
            return;
        }

        async function fetchPacks() {
            setIsLoading(true);
            setError(null);
            try {
                const installedPacks = await getInstalledDataPacks();
                setPacks(installedPacks);
                if (installedPacks.length > 0) {
                    setSelectedPack(installedPacks[0]);
                }
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
                <div className="flex flex-col items-center justify-center h-96">
                    <DialogHeader className="text-center mb-4"><DialogTitle>Loading Your DataPacks...</DialogTitle></DialogHeader>
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )
        }
        if (error) {
            return (
                <Alert variant="destructive"><X className="h-4 w-4" /><AlertTitle>Could not load packs</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
            );
        }

        if (wizardPack) {
            return <WizardForm pack={wizardPack} onPromptGenerated={onPromptGenerated} />;
        }

        if (packs.length > 0) {
            return (
                <>
                    <DialogHeader>
                        <DialogTitle className="font-headline text-3xl">Select DataPack</DialogTitle>
                        <DialogDescription>Choose one of your installed packs to start building a prompt.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 min-h-[60vh]">
                        <div className="md:col-span-2">
                            <PackPreview pack={selectedPack} />
                        </div>
                        <div className="md:col-span-1">
                            <PackSelector
                                packs={packs}
                                onSelect={setSelectedPack}
                                onChoose={() => setWizardPack(selectedPack)}
                                selectedPackId={selectedPack?.id || null}
                            />
                        </div>
                    </div>
                </>
            );
        }

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
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl">
                {renderContent()}
            </DialogContent>
        </Dialog>
    )
}
