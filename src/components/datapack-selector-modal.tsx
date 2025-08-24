
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { getInstalledDataPacks } from '@/app/actions/datapacks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, Wand2, Package, ArrowLeft, Info, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { DataPack, Option, PromptTemplate, CharacterProfileSchema, EquipmentSlotOptions, EquipmentOption } from '@/types/datapack';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import Link from 'next/link';
import { Badge } from './ui/badge';
import { getSlotCategory } from '@/lib/app-config';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/hooks/use-auth';
import { DataPackCard } from '@/components/datapack/datapack-card';

function DataPackInfoDialog({ pack, isOpen, onClose }: { pack: DataPack | null, isOpen: boolean, onClose: () => void }) {
    if (!pack) return null;

    const allSlots = pack.schema?.characterProfileSchema 
        ? Object.keys(pack.schema.characterProfileSchema)
        : [];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">{pack.name}</DialogTitle>
                    <DialogDescription>{pack.description}</DialogDescription>
                </DialogHeader>
                 <ScrollArea className="max-h-[60vh] -mx-6 px-6 py-4">
                     <div className="space-y-6">
                        {allSlots.length > 0 && (
                             <div>
                                <h4 className="font-semibold mb-2">Available Options</h4>
                                 <div className="flex flex-wrap gap-2">
                                     {allSlots.map((slotKey) => (
                                        <Badge 
                                            key={slotKey} 
                                            variant="outline"
                                            data-category={getSlotCategory(slotKey)}
                                        >
                                            {slotKey}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
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
    options,
    currentValue,
    onSelect,
    title,
}: {
    isOpen: boolean;
    onClose: () => void;
    options: (EquipmentOption | Option)[];
    currentValue: string;
    onSelect: (value: string) => void;
    title: string;
}) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">{title}</DialogTitle>
                    <DialogDescription>Select an option for this category.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                     <div className="flex flex-wrap gap-2 pt-2">
                         {options.map((option) => (
                             <Button
                                 key={option.value}
                                 type="button"
                                 variant={currentValue === option.value ? 'default' : 'secondary'}
                                 onClick={() => {
                                     onSelect(option.value);
                                     onClose();
                                 }}
                                 className="rounded-full"
                             >
                                 {option.label}
                             </Button>
                         ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}


function WizardGrid({ pack, onWizardComplete, onBack }: { pack: DataPack, onWizardComplete: (wizardData: Record<string, string>, pack: DataPack, template: PromptTemplate) => void, onBack: () => void }) {
    const { handleSubmit, watch, setValue, getValues } = useForm();
    const [activeModal, setActiveModal] = useState<{title: string, options: (EquipmentOption | Option)[], fieldName: string} | null>(null);

    const schema = pack.schema?.characterProfileSchema;
    const initialTemplate = pack.schema?.promptTemplates?.[0];
   
    useEffect(() => {
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
    }, [pack, schema, setValue]);


    const onSubmit = (data: any) => {
        if (initialTemplate) {
          onWizardComplete(data, pack, initialTemplate);
        }
    };
    
    if (!schema) {
        return (
             <div className="flex-grow flex items-center justify-center">
                <Alert variant="destructive">
                  <AlertTitle>Invalid DataPack</AlertTitle>
                  <AlertDescription>
                    This DataPack does not have a valid schema. Please correct it in the admin panel.
                  </AlertDescription>
                </Alert>
            </div>
        )
    }
    
    const renderSimpleSlot = (fieldName: keyof CharacterProfileSchema, label: string) => {
        const options = (schema as any)[fieldName] as (EquipmentOption[] | Option[]);
        if (!options || !Array.isArray(options) || options.length === 0) return null;
        
        const selectedValue = getValues(fieldName as string);
        const selectedOption = options.find(o => o.value === selectedValue);

        return (
            <div onClick={() => setActiveModal({ title: label, options, fieldName: fieldName as string })} className="flex justify-between items-center p-3 rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                <span className="text-sm text-muted-foreground">{label}</span>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-primary font-semibold truncate max-w-[150px]">{selectedOption?.label || 'None'}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
            </div>
        );
    };

    const renderEquipmentSlot = (fieldName: keyof CharacterProfileSchema, label: string) => {
        const slotOptions = (schema as any)[fieldName] as EquipmentSlotOptions;
        if (!slotOptions || Object.values(slotOptions).every(arr => !arr || arr.length === 0)) return null;

        return (
            <AccordionItem value={fieldName as string}>
                <AccordionTrigger className="text-sm">{label}</AccordionTrigger>
                <AccordionContent className="space-y-1 p-1">
                    {Object.entries(slotOptions).map(([subKey, options]) => {
                         if (!options || !Array.isArray(options) || options.length === 0) return null;
                         const subFieldName = `${fieldName}.${subKey}`;
                         const selectedValue = getValues(subFieldName);
                         const selectedOption = options.find(o => o.value === selectedValue);
                         
                         return (
                             <div key={subKey} onClick={() => setActiveModal({ title: `${label} - ${subKey}`, options, fieldName: subFieldName })} className="flex justify-between items-center p-2 rounded-md cursor-pointer hover:bg-muted/20">
                                 <p className="text-xs text-muted-foreground capitalize">{subKey}</p>
                                 <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-primary truncate max-w-[120px]">{selectedOption?.label || 'None'}</p>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                 </div>
                             </div>
                         )
                    })}
                </AccordionContent>
            </AccordionItem>
        )
    }


    return (
        <>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-headline text-2xl">
                    <Wand2 className="h-6 w-6 text-primary" /> {pack.name} Wizard
                </DialogTitle>
                <DialogDescription>
                    Configure the character's profile by selecting from the available options.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-grow min-h-0">
                 {activeModal && (
                    <OptionSelectModal
                        isOpen={!!activeModal}
                        onClose={() => setActiveModal(null)}
                        options={activeModal.options}
                        currentValue={getValues(activeModal.fieldName)}
                        onSelect={(value) => setValue(activeModal.fieldName, value)}
                        title={activeModal.title}
                    />
                )}
                <ScrollArea className="flex-grow my-4 pr-3 -mr-3">
                    <div className="space-y-4">
                        <Accordion type="multiple" defaultValue={['general', 'appearance', 'equipment']} className="w-full">
                            <AccordionItem value="general">
                                <AccordionTrigger>General</AccordionTrigger>
                                <AccordionContent className="space-y-1">
                                    {renderSimpleSlot('count', 'Count')}
                                    {renderSimpleSlot('raceClass', 'Race/Class')}
                                    {renderSimpleSlot('gender', 'Gender')}
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="appearance">
                                <AccordionTrigger>Appearance</AccordionTrigger>
                                <AccordionContent className="space-y-1">
                                    {renderSimpleSlot('hair', 'Hair')}
                                    {renderSimpleSlot('eyes', 'Eyes')}
                                    {renderSimpleSlot('skin', 'Skin')}
                                    {renderSimpleSlot('facialFeatures', 'Facial Features')}
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="equipment">
                                <AccordionTrigger>Equipment</AccordionTrigger>
                                <AccordionContent className="pt-2">
                                    <Accordion type="multiple" className="w-full space-y-1" defaultValue={['torso', 'legs', 'hands']}>
                                        {renderEquipmentSlot('head', 'Head')}
                                        {renderEquipmentSlot('face', 'Face')}
                                        {renderEquipmentSlot('neck', 'Neck')}
                                        {renderEquipmentSlot('shoulders', 'Shoulders')}
                                        {renderEquipmentSlot('torso', 'Torso')}
                                        {renderEquipmentSlot('arms', 'Arms')}
                                        {renderEquipmentSlot('hands', 'Hands')}
                                        {renderEquipmentSlot('waist', 'Waist')}
                                        {renderEquipmentSlot('legs', 'Legs')}
                                        {renderEquipmentSlot('feet', 'Feet')}
                                        {renderEquipmentSlot('back', 'Back')}
                                    </Accordion>
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="scene">
                                <AccordionTrigger>Scene & Action</AccordionTrigger>
                                <AccordionContent className="space-y-1">
                                    {renderSimpleSlot('pose', 'Pose')}
                                    {renderSimpleSlot('action', 'Action')}
                                    {renderSimpleSlot('camera', 'Camera')}
                                    {renderSimpleSlot('background', 'Background')}
                                    {renderSimpleSlot('effects', 'Effects')}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
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
    const { authUser } = useAuth();

    useEffect(() => {
        if (!authUser) {
            setIsLoading(false);
            return;
        }

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
    }, [authUser]);

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
             <div className="flex-grow min-h-0 py-4">
                <ScrollArea className="h-full pr-4 -mr-4">
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {packs.map(pack => (
                           <div key={pack.id} onClick={() => onChoosePack(pack)}>
                               <DataPackCard pack={pack} isCompact={true} />
                           </div>
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
    onPromptGenerated: (wizardData: Record<string, string>, pack: DataPack, template: PromptTemplate) => void;
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
    
    const handleWizardComplete = useCallback((wizardData: Record<string, string>, pack: DataPack, template: PromptTemplate) => {
        if (wizardPack) {
            onPromptGenerated(wizardData, wizardPack, template);
        }
        onClose();
    }, [onPromptGenerated, onClose, wizardPack]);
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={cn("max-h-[90vh] flex flex-col", wizardPack ? "sm:max-w-3xl" : "sm:max-w-4xl")}>
                {wizardPack ? (
                    <WizardGrid pack={wizardPack} onWizardComplete={handleWizardComplete} onBack={() => setWizardPack(null)} />
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

    