
'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowRight } from 'lucide-react';
import { BackButton } from '@/components/back-button';
import type { DataPack, Slot, Option } from '@/types/datapack';
import { getDataPack } from '../datapacks/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

function PromptWizardComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const packId = searchParams.get('pack');

    const [pack, setPack] = useState<DataPack | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { control, handleSubmit, watch, setValue } = useForm();
    const formValues = watch();

    useEffect(() => {
        async function fetchPack() {
            if (!packId) {
                setError("No DataPack ID specified in URL.");
                setIsLoading(false);
                return;
            }
            try {
                const packData = await getDataPack(packId);
                if (!packData || !packData.schema) {
                    throw new Error(`DataPack with ID "${packId}" not found or has no valid schema.`);
                }
                
                // Set default values for the form based on the schema
                for (const slot of packData.schema.slots) {
                    if (slot.defaultOption) {
                        setValue(slot.id, slot.defaultOption, { shouldValidate: true });
                    }
                }
                setPack(packData);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchPack();
    }, [packId, setValue]);

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
        if (!pack?.schema || !packId) return;
        let prompt = pack.schema.promptTemplate;
        for (const key in data) {
            const placeholder = `{${key}}`;
            prompt = prompt.replace(new RegExp(placeholder, 'g'), data[key] || '');
        }
        prompt = prompt.replace(/\{[a-zA-Z0-9_.]+\}/g, '').replace(/(\s*,\s*)+/g, ', ').replace(/^,|,$/g, '').trim();
        router.push(`/character-generator?prompt=${encodeURIComponent(prompt)}&packId=${encodeURIComponent(packId)}`);
    };

    if (isLoading) {
        return (
             <div className="flex items-center justify-center h-full w-full p-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
         return (
             <Alert variant="destructive" className="max-w-2xl mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading DataPack</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
         )
    }

    if (!pack?.schema) {
        return <p>No schema loaded.</p>
    }

    return (
      <div className="container py-8">
        <div className="mx-auto grid w-full max-w-2xl gap-2 mb-8">
            <div className="flex items-center gap-4">
                <BackButton />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">{pack.name}</h1>
                    <p className="text-muted-foreground">
                       Fill out the fields to construct a detailed character prompt.
                    </p>
                </div>
            </div>
        </div>

        <Card className="max-w-2xl mx-auto">
             <CardHeader>
                <CardTitle>Character Details</CardTitle>
                <CardDescription>Each selection will add more detail to your final prompt.</CardDescription>
            </CardHeader>
            <CardContent>
                 <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                {slot.options.map(option => (
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
                    
                    <Button type="submit" size="lg" className="w-full">
                        Generate Prompt <ArrowRight className="ml-2" />
                    </Button>
                </form>
            </CardContent>
        </Card>
      </div>
    );
}

export default function PromptWizardPage() {
    return (
        <Suspense fallback={
             <div className="flex items-center justify-center h-screen w-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <PromptWizardComponent />
        </Suspense>
    );
}

    