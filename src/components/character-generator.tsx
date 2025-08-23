
"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wand2, Loader2, FileText, Save, AlertCircle, Image as ImageIcon, Check, Package, Square, RectangleHorizontal, RectangleVertical, Tags, Settings, User, Pilcrow, Shield, Swords, Info, Text, GripVertical, ChevronDown, Star, CaseSensitive, Pencil, Braces, ArrowLeft, ArrowRight, BrainCircuit } from "lucide-react";

import { 
    Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
    Input, Textarea, Alert, AlertDescription, AlertTitle, Badge,
    RadioGroup, RadioGroupItem, Slider, Tabs, TabsContent, TabsList, TabsTrigger,
    Accordion, AccordionContent, AccordionItem, AccordionTrigger,
    ScrollArea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
    Label, Switch, Skeleton
} from "@/components/ui";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { saveCharacter } from "@/app/actions/character-write";
import { generateCharacterSheetData, generateCharacterPortrait } from "@/app/character-generator/actions";
import { getModels } from "@/app/actions/ai-models";
import { getDataPackForAdmin } from "@/app/actions/datapacks";
import { DataPackSelectorModal } from "./datapack-selector-modal";
import { cn } from "@/lib/utils";
import { TagAssistantModal } from "./tag-assistant-modal";
import { ModelSelectorModal } from './model-selector-modal';
import type { AiModel } from '@/types/ai-model';
import { VisualModelSelector } from "./visual-model-selector";
import type { GenerationResult } from "@/types/generation";
import type { DataPack, PromptTemplate, Option, CharacterProfileSchema, EquipmentSlotOptions, EquipmentOption } from '@/types/datapack';
import { textModels } from "@/lib/app-config";
import type { User as FirebaseUser } from "firebase/auth";
import { AnimatePresence, motion } from 'framer-motion';

type GenerationStep = 'concept' | 'details' | 'portrait' | 'complete';

const stepSchema = z.object({
  // Step 1: Concept
  description: z.string().min(1, { message: "A description is required to start." }).max(4000),
  wizardData: z.record(z.string()).optional(),
  targetLanguage: z.enum(['English', 'Spanish', 'French', 'German']).default('English'),
  selectedTextModel: z.custom<AiModel>(),
  
  // Step 2: Details & Portrait Prompt
  name: z.string().optional(),
  archetype: z.string().optional(),
  biography: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  physicalDescription: z.string().optional(),
  
  // Step 3: Portrait Generation
  aspectRatio: z.enum(['1:1', '16:9', '9:16']).default('1:1'),
  selectedModel: z.custom<AiModel>().optional(),
  selectedLora: z.custom<AiModel>().optional().nullable(),
  loraWeight: z.number().min(0).max(2).optional(),
  imageUrl: z.string().optional(),
  
  // Meta
  originalDescription: z.string().optional(),
  dataPackId: z.string().optional().nullable(),
  textEngine: z.string().optional(),
  imageEngine: z.string().optional(),
});


export function CharacterGenerator({ authUser }: { authUser: FirebaseUser | null }) {
    const searchParams = useSearchParams();
    const [currentStep, setCurrentStep] = useState<GenerationStep>('concept');
    const [isProcessing, startProcessingTransition] = useTransition();
    const [isSaving, startSavingTransition] = useTransition();

    const [isPackModalOpen, setIsPackModalOpen] = useState(false);
    const [initialPack, setInitialPack] = useState<DataPack | null>(null);
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);
    
    const [availableModels, setAvailableModels] = useState<AiModel[]>([]);
    const [availableLoras, setAvailableLoras] = useState<AiModel[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(true);

    const { toast } = useToast();
    const { userProfile } = useAuth();
    const router = useRouter();

    const form = useForm<z.infer<typeof stepSchema>>({
        resolver: zodResolver(stepSchema),
        defaultValues: {
            description: "",
            wizardData: {},
            targetLanguage: 'English',
            selectedTextModel: textModels[0],
            aspectRatio: '1:1',
            loraWeight: 0.75,
        },
    });

    const handleWizardDataChange = useCallback((wizardData: Record<string, string>, pack: DataPack, template: PromptTemplate) => {
        let finalPrompt = template.template || '';
        for (const slotId in wizardData) {
            const selectedValue = wizardData[slotId];
            if (!selectedValue) continue;

            const slotConfig = (pack.schema.characterProfileSchema as any)[slotId];
            let foundOption: Option | undefined = undefined;

            if (Array.isArray(slotConfig)) {
                foundOption = slotConfig.find(o => o.value === selectedValue);
            } else if (typeof slotConfig === 'object' && slotConfig !== null) {
                for (const subCategory in slotConfig) {
                    const options = (slotConfig as any)[subCategory] as Option[];
                    if (Array.isArray(options)) {
                        const option = options.find(o => o.value === selectedValue);
                        if (option) { foundOption = option; break; }
                    }
                }
            }
            finalPrompt = finalPrompt.replace(`{${slotId}}`, foundOption?.value || selectedValue);
        }
        finalPrompt = finalPrompt.replace(/\{[a-zA-Z_]+\}/g, '').replace(/,\s*,/g, ',').replace(/, ,/g,',').trim();
        form.setValue('description', finalPrompt, { shouldValidate: true });
        form.setValue('wizardData', wizardData);
        form.setValue('dataPackId', pack.id);
        setIsPackModalOpen(false);
    }, [form]);

    useEffect(() => {
        async function loadInitialData() {
            setIsLoadingModels(true);
            try {
                const [userModels, userLoras, packIdFromUrl] = await Promise.all([
                    authUser ? getModels('model', authUser.uid) : getModels('model'),
                    authUser ? getModels('lora', authUser.uid) : getModels('lora'),
                    Promise.resolve(searchParams.get('packId')),
                ]);
                
                setAvailableModels(userModels);
                setAvailableLoras(userLoras);
                form.setValue('selectedModel', userModels[0]);
                
                if (packIdFromUrl) {
                    const packData = await getDataPackForAdmin(packIdFromUrl);
                    if (packData) {
                        setInitialPack(packData);
                        setIsPackModalOpen(true);
                    }
                }
            } catch (error) { toast({ variant: 'destructive', title: 'Error', description: 'Could not load required data.' }); }
            finally { setIsLoadingModels(false); }
        }
        loadInitialData();
    }, [authUser, searchParams, toast, form]);

    const handleNextStep = async () => {
        if (!authUser) {
            toast({ variant: "destructive", title: "Authentication Required", description: "Please log in to generate a character." });
            return;
        }

        if (currentStep === 'concept') {
            const isValid = await form.trigger('description');
            if (!isValid) return;

            startProcessingTransition(async () => {
                const { description, targetLanguage, selectedTextModel } = form.getValues();
                const result = await generateCharacterSheetData({
                    description, targetLanguage,
                    engineConfig: {
                        engineId: selectedTextModel.engine as 'gemini' | 'openrouter',
                        modelId: selectedTextModel.hf_id,
                        userApiKey: userProfile?.preferences?.openRouterApiKey,
                    },
                });

                if (result.success && result.data) {
                    form.setValue('name', result.data.name);
                    form.setValue('archetype', result.data.archetype);
                    form.setValue('biography', result.data.biography);
                    form.setValue('equipment', result.data.equipment);
                    form.setValue('physicalDescription', result.data.physicalDescription);
                    form.setValue('originalDescription', description);
                    form.setValue('textEngine', selectedTextModel.engine);
                    setCurrentStep('details');
                    toast({ title: "Details Forged!", description: "Review the generated text, then create the portrait." });
                } else {
                    toast({ variant: "destructive", title: "Generation Failed", description: result.error });
                }
            });
        }

        if (currentStep === 'details') {
             const isValid = await form.trigger('physicalDescription');
             if(!isValid) {
                 toast({ variant: "destructive", title: "Image Prompt Required", description: "The physical description can't be empty." });
                 return;
             }
             setCurrentStep('portrait');
        }

        if (currentStep === 'portrait') {
            const isValid = await form.trigger('selectedModel');
            if (!isValid) {
                toast({ variant: "destructive", title: "Model Required", description: "Please select a base model for generation." });
                return;
            };

            startProcessingTransition(async () => {
                const result = await generateCharacterPortrait(form.getValues());
                if (result.success && result.imageUrl) {
                    form.setValue('imageUrl', result.imageUrl);
                    form.setValue('imageEngine', form.getValues('selectedModel')?.engine);
                    setCurrentStep('complete');
                    toast({ title: "Portrait Generated!", description: "Your character is ready to be saved." });
                } else {
                    toast({ variant: "destructive", title: "Portrait Failed", description: result.error });
                }
            });
        }
    };
    
    async function onSave() {
        if (!authUser) return;
        const formData = form.getValues();
        startSavingTransition(async () => {
            try {
                const result = await saveCharacter({
                    name: formData.name || 'Unnamed',
                    biography: formData.biography || '',
                    imageUrl: formData.imageUrl!,
                    dataPackId: formData.dataPackId,
                    archetype: formData.archetype,
                    equipment: formData.equipment,
                    physicalDescription: formData.physicalDescription,
                    textEngine: formData.textEngine as any,
                    imageEngine: formData.imageEngine as any,
                    wizardData: formData.wizardData,
                    originalPrompt: formData.originalDescription,
                });
                if (result.success && result.characterId) {
                    toast({ title: "Character Saved!", description: `${formData.name} is now in your armory.` });
                    router.push(`/characters/${result.characterId}/edit`);
                } else { throw new Error("Failed to save character."); }
            } catch (err: unknown) {
                toast({ variant: "destructive", title: "Save Failed", description: err instanceof Error ? err.message : "An unknown error occurred." });
            }
        });
    }

    const renderStep = () => {
        switch (currentStep) {
            case 'concept': return <ConceptStep form={form} setIsPackModalOpen={setIsPackModalOpen} />;
            case 'details': return <DetailsStep form={form} />;
            case 'portrait': return <PortraitStep form={form} models={availableModels} loras={availableLoras} isLoadingModels={isLoadingModels} />;
            case 'complete': return <CompleteStep form={form} onSave={onSave} isSaving={isSaving} />;
            default: return null;
        }
    };

    return (
        <>
            <DataPackSelectorModal isOpen={isPackModalOpen} onClose={() => setIsPackModalOpen(false)} onPromptGenerated={handleWizardDataChange} initialPack={initialPack} />
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                    <Form {...form}>
                    <Card className="shadow-lg">
                        <CardContent className="p-4 sm:p-6">
                            {renderStep()}
                        </CardContent>
                        <CardFooter className="pt-4 border-t flex justify-between">
                            <Button variant="outline" onClick={() => setCurrentStep(prev => prev === 'details' ? 'concept' : prev === 'portrait' ? 'details' : 'portrait')} disabled={currentStep === 'concept' || isProcessing}>
                                <ArrowLeft /> Back
                            </Button>
                            {currentStep !== 'complete' ? (
                                <Button onClick={handleNextStep} disabled={isProcessing || !authUser}>
                                    {isProcessing ? <Loader2 className="animate-spin" /> : currentStep === 'portrait' ? <Wand2/> : <ArrowRight />}
                                    {isProcessing ? 'Forging...' : (currentStep === 'concept' ? 'Next: Generate Details' : currentStep === 'details' ? 'Next: Generate Portrait' : 'Generate Portrait')}
                                </Button>
                            ) : <div></div>}
                        </CardFooter>
                    </Card>
                    </Form>
                </motion.div>
            </AnimatePresence>
            {!authUser && <Alert className="mt-4"><AlertCircle className="h-4 w-4" /><AlertTitle>Heads up!</AlertTitle><AlertDescription>You need to be logged in to generate and save characters.</AlertDescription></Alert>}
        </>
    );
}

// Step 1: Concept
function ConceptStep({ form, setIsPackModalOpen }: { form: any, setIsPackModalOpen: (isOpen: boolean) => void }) {
    return (
        <div className="space-y-4">
            <h2 className="font-headline text-2xl flex items-center gap-2"><span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-sans">1</span>The Concept</h2>
            <FormField
              control={form.control} name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Character Prompt</FormLabel>
                  <Textarea {...field} placeholder="A grizzled space marine with a cybernetic arm, a haunted past, and a heart of gold..." className="min-h-[200px]" />
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" variant="outline" onClick={() => setIsPackModalOpen(true)}><Package className="mr-2" /> Use a DataPack Wizard</Button>
        </div>
    );
}

// Step 2: Details
function DetailsStep({ form }: { form: any }) {
    return (
        <div className="space-y-6">
            <h2 className="font-headline text-2xl flex items-center gap-2"><span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-sans">2</span>The Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>} />
                <FormField control={form.control} name="archetype" render={({ field }) => <FormItem><FormLabel>Archetype</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>} />
            </div>
             <FormField control={form.control} name="biography"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biography</FormLabel>
                  <Textarea {...field} className="min-h-[150px]" />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="physicalDescription"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>Image Prompt (Editable)</FormLabel>
                    <Alert><Info className="h-4 w-4" /><AlertDescription>This text will be used to generate the image. You can edit it to refine the portrait.</AlertDescription></Alert>
                    <Textarea {...field} className="min-h-[150px] font-mono text-xs mt-2" />
                </FormItem>
              )}
            />
        </div>
    );
}

// Step 3: Portrait
function PortraitStep({ form, models, loras, isLoadingModels }: { form: any, models: AiModel[], loras: AiModel[], isLoadingModels: boolean }) {
    const [modelModalType, setModelModalType] = useState<'model' | 'lora' | 'text'>('model');
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    
    const handleOpenModelModal = (type: 'model' | 'lora') => {
        setModelModalType(type);
        setIsModelModalOpen(true);
    }
    const handleModelSelect = (model: AiModel) => {
        if (model.type === 'model') form.setValue('selectedModel', model, { shouldValidate: true });
        else if (model.type === 'lora') form.setValue('selectedLora', model);
        setIsModelModalOpen(false);
    }

    const selectedModel = form.watch('selectedModel');
    const selectedLora = form.watch('selectedLora');
    const loraCompatible = selectedModel?.engine === 'huggingface' || selectedModel?.engine === 'vertexai' || selectedModel?.engine === 'modelslab';
    
    return (
        <>
        <ModelSelectorModal isOpen={isModelModalOpen} onClose={() => setIsModelModalOpen(false)} onSelect={handleModelSelect} type={modelModalType} models={modelModalType === 'model' ? models : loras} isLoading={isLoadingModels} />
        <div className="space-y-6">
            <h2 className="font-headline text-2xl flex items-center gap-2"><span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-sans">3</span>The Portrait</h2>
            <div className="grid md:grid-cols-2 gap-6 items-start">
                 <FormField
                  control={form.control} name="aspectRatio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aspect Ratio</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-3 gap-2 pt-2">
                           <FormItem><FormControl><RadioGroupItem value="1:1" id="square" className="sr-only" /></FormControl><FormLabel htmlFor="square" className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-center", field.value === '1:1' && "border-primary")}><Square className="mb-2 h-5 w-5" /><span className="text-xs">Square</span></FormLabel></FormItem>
                           <FormItem><FormControl><RadioGroupItem value="16:9" id="landscape" className="sr-only" /></FormControl><FormLabel htmlFor="landscape" className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-center", field.value === '16:9' && "border-primary")}><RectangleHorizontal className="mb-2 h-5 w-5" /><span className="text-xs">Landscape</span></FormLabel></FormItem>
                           <FormItem><FormControl><RadioGroupItem value="9:16" id="portrait" className="sr-only" /></FormControl><FormLabel htmlFor="portrait" className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-center", field.value === '9:16' && "border-primary")}><RectangleVertical className="mb-2 h-5 w-5" /><span className="text-xs">Portrait</span></FormLabel></FormItem>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
                 <div className="space-y-4">
                     <VisualModelSelector label="Image Model" model={selectedModel} onOpen={() => handleOpenModelModal('model')} disabled={false} isLoading={isLoadingModels} />
                     <VisualModelSelector label="LoRA (Optional)" model={selectedLora} onOpen={() => handleOpenModelModal('lora')} disabled={!loraCompatible || loras.length === 0} isLoading={isLoadingModels} />
                      {selectedLora && loraCompatible && (
                        <FormField control={form.control} name="loraWeight" render={({ field }) => (
                            <FormItem><div className="flex justify-between"><FormLabel>LoRA Weight</FormLabel><span className="text-sm font-medium">{field.value?.toFixed(2)}</span></div><FormControl><Slider defaultValue={[field.value || 0.75]} max={2} step={0.05} onValueChange={(value) => field.onChange(value[0])} /></FormControl></FormItem>
                         )} />
                      )}
                </div>
            </div>
        </div>
        </>
    );
}

// Step 4: Complete
function CompleteStep({ form, onSave, isSaving }: { form: any, onSave: () => void, isSaving: boolean }) {
    const { name, archetype, biography, equipment, imageUrl } = form.getValues();
    return (
        <div className="space-y-6">
            <h2 className="font-headline text-2xl flex items-center gap-2"><Check className="h-8 w-8 text-green-500"/>Forge Complete!</h2>
            <div className="grid md:grid-cols-5 gap-6 items-start">
                <div className="md:col-span-2">
                    <Image src={imageUrl} alt={name} width={512} height={512} className="rounded-lg border-2 border-primary/50 shadow-lg object-contain" />
                </div>
                <div className="md:col-span-3 space-y-4">
                    <h3 className="text-xl font-bold">{name}</h3>
                    <Badge>{archetype}</Badge>
                    <ScrollArea className="h-40 border rounded-md p-3"><p className="text-sm text-muted-foreground whitespace-pre-wrap">{biography}</p></ScrollArea>
                    <Button onClick={onSave} disabled={isSaving} size="lg" className="w-full">
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save />} Save to Armory
                    </Button>
                </div>
            </div>
        </div>
    );
}
