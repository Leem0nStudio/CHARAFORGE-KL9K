
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { getInstalledDataPacks } from '@/app/actions/datapacks';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardHeader, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, ArrowRight, Package, ArrowLeft, Wand2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { DataPack, Option, PromptTemplate, CharacterProfileSchema } from '@/types/datapack';
import { ScrollArea } from './ui/scroll-area';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { DataPackCard } from '@/components/datapack/datapack-card';
import { motion } from 'framer-motion';
import { getDatasetForDataPack } from '@/services/composition';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

function OptionSelector({ options, control, fieldName }: { options: Option[], control: any, fieldName: string }) {
    return (
        <Controller
            name={fieldName}
            control={control}
            defaultValue={options[0]?.value || ''}
            render={({ field }) => (
                 <div className="flex flex-wrap gap-2">
                    {options.map((opt: Option, index: number) => (
                        <Button
                            key={`${opt.value}-${index}`}
                            type="button"
                            variant={field.value === opt.value ? 'default' : 'secondary'}
                            size="sm"
                            onClick={() => field.onChange(opt.value)}
                            className="rounded-full h-auto py-1 px-3"
                        >
                            {opt.label}
                        </Button>
                    ))}
                </div>
            )}
        />
    );
}

function DataPackWizard({ 
    pack, 
    onWizardComplete, 
    onBack,
    selectedTemplate,
    onTemplateChange
}: { 
    pack: DataPack, 
    onWizardComplete: (wizardData: Record<string, any>, pack: DataPack, template: PromptTemplate) => void, 
    onBack: () => void,
    selectedTemplate: PromptTemplate | null;
    onTemplateChange: (templateName: string) => void;
}) {
    const { handleSubmit, control, setValue } = useForm();
    
    const dataset = getDatasetForDataPack(pack);

    useEffect(() => {
        if (!dataset) return;
        // Initialize form with the first option for each slot
        Object.entries(dataset).forEach(([key, options]) => {
            if (options.length > 0) {
                setValue(key, options[0].value);
            }
        });
    }, [pack, dataset, setValue]);
    
    if (!dataset || !selectedTemplate) {
         return (
             <div className="flex-grow flex items-center justify-center">
                <Alert variant="destructive">
                  <AlertTitle>Invalid DataPack</AlertTitle>
                  <AlertDescription>This DataPack does not have a valid schema or prompt templates.</AlertDescription>
                </Alert>
            </div>
        )
    }

    const onSubmit = (data: any) => {
        if (!selectedTemplate) {
             // This should not happen if the component renders, but as a safeguard.
            console.error("No template selected on submit.");
            return;
        }
        onWizardComplete(data, pack, selectedTemplate);
    };

    return (
         <motion.div
            key="wizard"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full flex flex-col h-full"
        >
            <div className="flex-shrink-0 mb-4">
                 <Button type="button" variant="ghost" size="sm" className="text-muted-foreground mb-4" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to DataPacks
                </Button>
            </div>

            <Card className="flex-grow flex flex-col">
                 <form id="wizard-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-grow">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">{pack.name} Assistant</CardTitle>
                        <CardDescription>Select a template and options to build your prompt.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-hidden space-y-4">
                        <div>
                             <Label>Prompt Template</Label>
                             <Select onValueChange={onTemplateChange} defaultValue={selectedTemplate.name}>
                                 <SelectTrigger><SelectValue/></SelectTrigger>
                                 <SelectContent>
                                     {pack.schema.promptTemplates.map(t => (
                                         <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                                     ))}
                                 </SelectContent>
                             </Select>
                        </div>

                        <ScrollArea className="h-[48vh] pr-4">
                            <div className="space-y-6">
                                {Object.entries(dataset).map(([slotKey, options]) => (
                                     <div key={slotKey}>
                                        <h4 className="font-semibold text-muted-foreground capitalize mb-2 text-sm">
                                            {slotKey.replace(/_/g, ' ')}
                                        </h4>
                                        <OptionSelector fieldName={slotKey} options={options} control={control} />
                                    </div>
                                ))}
                             </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter className="border-t pt-4 flex justify-end">
                        <Button type="submit" form="wizard-form">
                           <Wand2 className="mr-2 h-4 w-4" /> Generate Prompt
                        </Button>
                    </CardFooter>
                 </form>
            </Card>
        </motion.div>
    );
}

function PackGallery({ onChoosePack, onBack }: { onChoosePack: (pack: DataPack) => void; onBack: () => void; }) {
    const [isLoading, setIsLoading] = useState(true);
    const [packs, setPacks] = useState<DataPack[]>([]);
    const { authUser } = useAuth();

    useEffect(() => {
        if (!authUser) { setIsLoading(false); return; }
        const loadPacks = async () => {
            setIsLoading(true);
            try {
                const installedPacks = await getInstalledDataPacks();
                setPacks(installedPacks);
            } catch (error) { console.error("Failed to load installed datapacks", error); }
            finally { setIsLoading(false); }
        };
        loadPacks();
    }, [authUser]);

    return (
        <motion.div
            key="gallery"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full"
        >
             <div className="flex items-center justify-between mb-4">
                <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Generator
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Select DataPack</CardTitle>
                    <CardDescription>Choose one of your installed packs to start building a prompt.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : packs.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                           {packs.map(pack => (
                              <DataPackCard key={pack.id} pack={pack} isCompact={true} onClick={() => onChoosePack(pack)} />
                           ))}
                        </div>
                    ) : (
                        <Alert className="mt-4">
                            <Package className="h-4 w-4" />
                            <AlertTitle>Your collection is empty!</AlertTitle>
                            <AlertDescription>
                                Visit the catalog to add some creative packs.
                                <Button asChild variant="link" className="p-0 h-auto ml-1"><Link href="/datapacks">Go to Catalog</Link></Button>
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

interface DataPackSelectorProps {
    onSelectPack: (pack: DataPack) => void;
    onBack: () => void;
}

export function DataPackSelector({ onSelectPack, onBack }: DataPackSelectorProps) {
    return <PackGallery onChoosePack={onSelectPack} onBack={onBack} />;
}

DataPackSelector.Wizard = DataPackWizard;
