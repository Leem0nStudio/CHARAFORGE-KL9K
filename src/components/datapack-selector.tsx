
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { getInstalledDataPacks } from '@/app/actions/datapacks';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardHeader, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowRight, Package, ArrowLeft, Info, ChevronRight, Wand2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { DataPack, Option, PromptTemplate, CharacterProfileSchema, EquipmentSlotOptions, EquipmentOption } from '@/types/datapack';
import { ScrollArea } from './ui/scroll-area';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { DataPackCard } from '@/components/datapack/datapack-card';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';


// Represents the top-level categories in the new cascader UI
type TopLevelCategory = 'general' | 'appearance' | 'equipment' | 'scene';

// Defines which profile schema keys belong to which top-level category
const categoryMapping: Record<TopLevelCategory, (keyof CharacterProfileSchema)[]> = {
    general: ['count', 'raceClass', 'gender'],
    appearance: ['hair', 'eyes', 'skin', 'facialFeatures'],
    equipment: ['head', 'face', 'neck', 'shoulders', 'torso', 'arms', 'hands', 'waist', 'legs', 'feet', 'back', 'weaponsExtra'],
    scene: ['pose', 'action', 'camera', 'background', 'effects'],
};


function DataPackWizard({ pack, onWizardComplete, onBack }: { pack: DataPack, onWizardComplete: (wizardData: Record<string, string>, pack: DataPack, template: PromptTemplate) => void, onBack: () => void }) {
    const { handleSubmit, setValue, watch, getValues } = useForm();
    const [activeCategory, setActiveCategory] = useState<TopLevelCategory>('general');
    const [activeSlot, setActiveSlot] = useState<keyof CharacterProfileSchema | null>(null);

    const schema = pack.schema?.characterProfileSchema;
    const initialTemplate = pack.schema?.promptTemplates?.[0];

    useEffect(() => {
        // Set default values for all slots when the component mounts
        if (!schema) return;
        Object.entries(schema).forEach(([key, value]) => {
            if (Array.isArray(value) && value.length > 0) {
                 setValue(key, value[0].value);
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                Object.entries(value).forEach(([subKey, subValue]) => {
                    if (Array.isArray(subValue) && subValue.length > 0) {
                        setValue(`${key}.${subKey}`, subValue[0].value);
                    }
                })
            }
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pack, schema]);

    if (!schema) {
         return (
             <div className="flex-grow flex items-center justify-center">
                <Alert variant="destructive">
                  <AlertTitle>Invalid DataPack</AlertTitle>
                  <AlertDescription>This DataPack does not have a valid schema.</AlertDescription>
                </Alert>
            </div>
        )
    }

    const onSubmit = (data: any) => {
        if (initialTemplate) {
          onWizardComplete(data, pack, initialTemplate);
        }
    };
    
    // Function to render the list of slots for the active top-level category
    const renderSlotColumn = () => {
        const slotsForCategory = categoryMapping[activeCategory];
        return (
            <div className="flex flex-col gap-1 pr-2">
                {slotsForCategory.map(slotKey => {
                    const slotData = (schema as any)[slotKey];
                    if (!slotData) return null; // Skip if slot is not in schema
                    
                    const isComplex = typeof slotData === 'object' && !Array.isArray(slotData);
                    const hasOptions = isComplex ? Object.values(slotData).some(arr => Array.isArray(arr) && arr.length > 0) : Array.isArray(slotData) && slotData.length > 0;
                    if (!hasOptions) return null;

                    return (
                        <button 
                            key={slotKey}
                            type="button" 
                            onClick={() => setActiveSlot(slotKey)}
                            className={cn(
                                "w-full text-left p-2 rounded-md text-sm transition-colors flex justify-between items-center",
                                activeSlot === slotKey ? "bg-primary/20" : "hover:bg-muted/50"
                            )}
                        >
                            <span className="capitalize">{slotKey.replace(/([A-Z])/g, ' $1')}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground"/>
                        </button>
                    );
                })}
            </div>
        );
    };

    // Function to render the options for the selected slot
    const renderOptionsColumn = () => {
        if (!activeSlot) return <div className="flex items-center justify-center h-full text-muted-foreground"><p>Select a category</p></div>;
        
        const slotData = (schema as any)[activeSlot];
        if (!slotData) return null;

        const isComplex = typeof slotData === 'object' && !Array.isArray(slotData);

        return (
            <div className="flex flex-col gap-2 pr-2">
                {isComplex ? (
                     Object.entries(slotData).map(([subKey, options]) => {
                         if (!Array.isArray(options) || options.length === 0) return null;
                         const fieldName = `${activeSlot}.${subKey}`;
                         return (
                             <div key={subKey}>
                                 <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1 capitalize">{subKey}</h4>
                                 <div className="flex flex-wrap gap-1">
                                     {options.map((opt: Option) => (
                                         <Button 
                                             key={opt.value} 
                                             type="button"
                                             variant={watch(fieldName) === opt.value ? 'default' : 'secondary'}
                                             size="sm"
                                             onClick={() => setValue(fieldName, opt.value)}
                                             className="rounded-full"
                                         >
                                             {opt.label}
                                         </Button>
                                     ))}
                                 </div>
                             </div>
                         )
                     })
                ) : (
                     <div className="flex flex-wrap gap-1">
                        {(slotData as Option[]).map(opt => (
                             <Button 
                                 key={opt.value} 
                                 type="button"
                                 variant={watch(activeSlot as string) === opt.value ? 'default' : 'secondary'}
                                 size="sm"
                                 onClick={() => setValue(activeSlot as string, opt.value)}
                                 className="rounded-full"
                             >
                                 {opt.label}
                             </Button>
                         ))}
                    </div>
                )}
            </div>
        );
    }

    return (
         <motion.div
            key="wizard"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full flex flex-col h-[70vh]"
        >
            <div className="flex-shrink-0 flex items-center justify-between mb-4">
                 <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to DataPacks
                </Button>
                 <Button type="button" size="sm" onClick={handleSubmit(onSubmit)}>
                    Generate Prompt <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>

            <Card className="flex-grow grid grid-cols-1 md:grid-cols-3 overflow-hidden">
                {/* Column 1: Top-level Categories */}
                <div className="bg-muted/30 p-2 space-y-1">
                    {Object.keys(categoryMapping).map(cat => (
                        <button 
                            key={cat} 
                            type="button"
                            onClick={() => {
                                setActiveCategory(cat as TopLevelCategory);
                                setActiveSlot(null); // Reset slot selection when category changes
                            }}
                            className={cn(
                                "w-full text-left p-2 rounded-md font-semibold text-sm transition-colors",
                                activeCategory === cat ? "bg-primary/20 text-primary" : "hover:bg-muted/50"
                            )}
                        >
                            <span className="capitalize">{cat}</span>
                        </button>
                    ))}
                </div>

                {/* Column 2: Slots */}
                <ScrollArea className="md:border-l md:border-r">
                    <div className="p-2">
                        {renderSlotColumn()}
                    </div>
                </ScrollArea>
                
                {/* Column 3: Options */}
                <ScrollArea>
                    <div className="p-4">
                        {renderOptionsColumn()}
                    </div>
                </ScrollArea>
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
                              <div key={pack.id} onClick={() => onChoosePack(pack)} className="cursor-pointer">
                                  <DataPackCard pack={pack} isCompact={true} />
                              </div>
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
