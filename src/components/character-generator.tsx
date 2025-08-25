
'use client';

import React, { useState, useEffect, useCallback, useTransition, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wand2, Loader2, Save, ArrowLeft, ArrowRight, CaseSensitive, Package, Tags, Image as ImageIcon, Square, RectangleHorizontal, RectangleVertical } from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Textarea,
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { saveCharacter } from '@/app/actions/character-write';
import {
  generateCharacterSheetData,
  generateCharacterPortrait,
} from '@/app/character-generator/actions';
import { getModels } from '@/app/actions/ai-models';
import { getDataPackForAdmin } from '@/app/actions/datapacks';
import type { AiModel } from '@/types/ai-model';
import {
  textModels,
  geminiImagePlaceholder,
} from '@/lib/app-config';
import type { DataPack, PromptTemplate } from '@/types/datapack';
import { AnimatePresence, motion } from 'framer-motion';
import { DataPackSelector } from '../components/datapack-selector';
import { VisualModelSelector } from './visual-model-selector';
import { ModelSelectorModal } from './model-selector-modal';
import { PromptEditor } from './prompt-editor';
import { TagAssistantModal } from './tag-assistant-modal';
import { cn } from '@/lib/utils';

type GenerationStep = 'concept' | 'details' | 'portrait' | 'complete';
type View = 'generator' | 'datapack-selector' | 'datapack-wizard';

const stepSchema = z.object({
  // Step 1: Concept
  description: z
    .string()
    .min(1, { message: 'A description is required to start.' })
    .max(4000),
  wizardData: z.record(z.union([z.string(), z.record(z.string())])).optional(),
  targetLanguage: z.enum(['English', 'Spanish', 'French', 'German']).default('English'),
  selectedTextModel: z.custom<AiModel>().optional(),

  // Step 2: Details & Portrait Prompt
  name: z.string().optional(),
  archetype: z.string().optional(),
  biography: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  physicalDescription: z.string().optional(),
  birthYear: z.string().optional(),
  weaknesses: z.string().optional(),

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
  rarity: z.number().min(1).max(5).optional(),
});


// Step 1: Concept Step Component
function ConceptStep({ form, onUseDataPack, activePack, selectedTemplate, handleWizardDataChange }: { form: any, onUseDataPack: () => void, activePack: DataPack | null, selectedTemplate: PromptTemplate | null, handleWizardDataChange: any }) {
  const { control, getValues } = form;
  const [isTagAssistantOpen, setIsTagAssistantOpen] = useState(false);
  const promptEditorRef = React.useRef<{ format: () => void }>(null);

  const handleAppendTags = (tags: string[]) => {
    const currentValue = getValues('description') || '';
    const newPrompt = [currentValue, ...tags].filter(Boolean).join(', ');
    form.setValue('description', newPrompt);
  };

  return (
    <div className="space-y-4">
      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <PromptEditor
            ref={promptEditorRef}
            value={field.value}
            onChange={field.onChange}
            activePack={activePack}
            selectedTemplate={selectedTemplate}
            onTemplateChange={(templateName: string) => {
              if (activePack) {
                const newTemplate = activePack.schema.promptTemplates.find(t => t.name === templateName);
                if (newTemplate) {
                  handleWizardDataChange(getValues('wizardData'), activePack, newTemplate);
                }
              }
            }}
          />
        )}
      />
      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" onClick={() => onUseDataPack()}>
          <Package className="mr-2"/> Use DataPack
        </Button>
        <Button type="button" variant="outline" onClick={() => setIsTagAssistantOpen(true)}>
          <Tags className="mr-2"/> Tag Assistant
        </Button>
      </div>
       <TagAssistantModal 
          isOpen={isTagAssistantOpen}
          onClose={() => setIsTagAssistantOpen(false)}
          onAppendTags={handleAppendTags}
          currentDescription={getValues('description')}
      />
      <div>
        <Label>Text Generation Model</Label>
        <Controller
            name="selectedTextModel"
            control={control}
            render={({ field }) => (
                 <Select onValueChange={(value) => {
                    const model = textModels.find(m => m.hf_id === value);
                    field.onChange(model);
                 }} defaultValue={field.value?.hf_id}>
                    <SelectTrigger>{field.value?.name || 'Select a model'}</SelectTrigger>
                    <SelectContent>
                        {textModels.map(model => (
                            <SelectItem key={model.id} value={model.hf_id}>{model.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
        />
      </div>
    </div>
  );
}

// Step 2: Details Step Component
function DetailsStep({ form }: { form: any }) {
  const { register, control } = form;
  return (
    <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} />
            </div>
            <div className="space-y-1">
                <Label htmlFor="archetype">Archetype</Label>
                <Input id="archetype" {...register('archetype')} />
            </div>
        </div>
      <div className="space-y-1">
        <Label htmlFor="biography">Biography</Label>
        <Textarea id="biography" {...register('biography')} className="min-h-[150px]"/>
      </div>
      <div className="space-y-1">
        <Label htmlFor="physicalDescription">Image Prompt (Physical Description)</Label>
        <Textarea id="physicalDescription" {...register('physicalDescription')} className="min-h-[100px]"/>
      </div>
    </div>
  );
}

// Step 3: Portrait Step Component
function PortraitStep({ form, models, loras, isLoadingModels }: { form: any, models: AiModel[], loras: AiModel[], isLoadingModels: boolean }) {
  const { control, watch } = form;
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isLoraModalOpen, setIsLoraModalOpen] = useState(false);
  const selectedLora = watch('selectedLora');

  const aspectRatioOptions = [
    { value: '1:1', label: 'Square', icon: <Square className="w-8 h-8" /> },
    { value: '16:9', label: 'Landscape', icon: <RectangleHorizontal className="w-8 h-8" /> },
    { value: '9:16', label: 'Portrait', icon: <RectangleVertical className="w-8 h-8" /> },
  ];

  return (
    <div className="space-y-4">
      <ModelSelectorModal 
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        onSelect={(model) => form.setValue('selectedModel', model)}
        type="model"
        models={models}
        isLoading={isLoadingModels}
      />
       <ModelSelectorModal 
        isOpen={isLoraModalOpen}
        onClose={() => setIsLoraModalOpen(false)}
        onSelect={(lora) => form.setValue('selectedLora', lora)}
        type="lora"
        models={loras}
        isLoading={isLoadingModels}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <Controller
            name="selectedModel"
            control={control}
            render={({ field }) => (
                <VisualModelSelector 
                    label="Base Model"
                    model={field.value}
                    onOpen={() => setIsModelModalOpen(true)}
                    disabled={isLoadingModels}
                    isLoading={isLoadingModels}
                />
            )}
        />
         <Controller
            name="selectedLora"
            control={control}
            render={({ field }) => (
                <VisualModelSelector 
                    label="Style LoRA (Optional)"
                    model={field.value}
                    onOpen={() => setIsLoraModalOpen(true)}
                    disabled={isLoadingModels}
                    isLoading={isLoadingModels}
                />
            )}
        />
      </div>

       {selectedLora && (
          <div className="space-y-2">
            <Label>LoRA Strength: {watch('loraWeight')}</Label>
            <Controller
              name="loraWeight"
              control={control}
              render={({ field }) => (
                <Slider
                  value={[field.value ?? 0.75]}
                  onValueChange={(value) => field.onChange(value[0])}
                  min={0}
                  max={2}
                  step={0.05}
                />
              )}
            />
          </div>
        )}

      <div>
        <Label>Aspect Ratio</Label>
         <Controller
            name="aspectRatio"
            control={control}
            render={({ field }) => (
                <div className="flex gap-2 mt-2">
                    {aspectRatioOptions.map(option => (
                        <button 
                            key={option.value}
                            type="button" 
                            onClick={() => field.onChange(option.value)}
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-colors",
                                field.value === option.value 
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "bg-muted/50 border-transparent hover:border-muted-foreground/50"
                            )}
                        >
                            {option.icon}
                            <span className="text-xs font-medium mt-1">{option.label}</span>
                        </button>
                    ))}
                </div>
            )}
        />
      </div>
    </div>
  );
}

// Step 4: Complete Step Component
function CompleteStep({ form, onSave, isSaving }: { form: any, onSave: () => void, isSaving: boolean }) {
  const { watch } = form;
  const imageUrl = watch('imageUrl');

  return (
    <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold font-headline">Character Forged!</h2>
         <div className="relative aspect-square max-w-sm mx-auto rounded-lg overflow-hidden border-2 border-primary/50 shadow-lg">
          {imageUrl ? <Image src={imageUrl} alt="Generated Character Portrait" layout="fill" objectFit="cover" /> : <div className="bg-muted w-full h-full flex items-center justify-center"><ImageIcon className="w-16 h-16 text-muted-foreground"/></div>}
        </div>
        <p className="text-muted-foreground">Your character, {watch('name')}, is ready. You can now save them to your gallery.</p>
        <Button size="lg" onClick={onSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 animate-spin"/> : <Save className="mr-2"/>}
            Save to My Characters
        </Button>
    </div>
  );
}


export function CharacterGenerator() {
  const searchParams = useSearchParams();
  const [currentView, setCurrentView] = useState<View>('generator');
  const [currentStep, setCurrentStep] = useState<GenerationStep>('concept');
  const [isProcessing, startProcessingTransition] = useTransition();
  const [isSaving, startSavingTransition] = useTransition();

  const [availableModels, setAvailableModels] = useState<AiModel[]>([]);
  const [availableLoras, setAvailableLoras] = useState<AiModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  const [activePack, setActivePack] = useState<DataPack | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);

  const { toast } = useToast();
  const { authUser, userProfile } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof stepSchema>>({
    resolver: zodResolver(stepSchema),
    defaultValues: {
      description: '',
      wizardData: {},
      targetLanguage: 'English',
      selectedTextModel: textModels[0],
      aspectRatio: '1:1',
      loraWeight: 0.75,
      selectedModel: geminiImagePlaceholder, // Safe default
    },
  });

  const handleWizardComplete = useCallback(
    (
      wizardData: Record<string, string>,
      pack: DataPack,
      template: PromptTemplate
    ) => {
      let finalPrompt = template.template || '';
      for (const slotId in wizardData) {
        const selectedValue = wizardData[slotId];
        if (!selectedValue) continue;

        const slotConfig = (pack.schema.characterProfileSchema as any)[slotId];
        let foundOption: { value: string } | undefined = undefined;

        if (Array.isArray(slotConfig)) {
          foundOption = slotConfig.find((o) => o.value === selectedValue);
        } else if (
          typeof slotConfig === 'object' &&
          slotConfig !== null &&
          !Array.isArray(slotConfig)
        ) {
          for (const subCategory in slotConfig) {
            const options = (slotConfig as any)[subCategory] as { value: string }[];
            if (Array.isArray(options)) {
              const option = options.find((o) => o.value === selectedValue);
              if (option) {
                foundOption = option;
                break;
              }
            }
          }
        }
        finalPrompt = finalPrompt.replace(
          `{${slotId}}`,
          foundOption?.value || selectedValue
        );
      }
      finalPrompt = finalPrompt
        .replace(/\{[a-zA-Z_]+\}/g, '')
        .replace(/,\s*,/g, ',')
        .replace(/, ,/g, ',')
        .trim();
      form.setValue('description', finalPrompt, { shouldValidate: true });
      form.setValue('wizardData', wizardData);
      form.setValue('dataPackId', pack.id);
      setActivePack(pack);
      setSelectedTemplate(template);
      setCurrentView('generator');
    },
    [form]
  );

  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingModels(true);
      try {
        const [userModels, userLoras, packIdFromUrl] = await Promise.all([
          getModels('model', authUser?.uid),
          getModels('lora', authUser?.uid),
          Promise.resolve(searchParams.get('packId')),
        ]);

        setAvailableModels(userModels);
        setAvailableLoras(userLoras);
        // Set a default model only if models are available, otherwise stick with placeholder
        if (userModels.length > 0) {
          form.setValue('selectedModel', userModels[0]);
        }

        if (packIdFromUrl) {
          const packData = await getDataPackForAdmin(packIdFromUrl);
          if (packData) {
            setActivePack(packData);
            setCurrentView('datapack-wizard');
          }
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load required data.',
        });
      } finally {
        setIsLoadingModels(false);
      }
    }
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, searchParams, toast]);

  const handleNextStep = async () => {
    if (!authUser) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in to generate a character.',
      });
      return;
    }

    if (currentStep === 'concept') {
      const isValid = await form.trigger('description');
      if (!isValid) return;

      startProcessingTransition(async () => {
        const { description, targetLanguage, selectedTextModel } =
          form.getValues();
        const result = await generateCharacterSheetData({
          description,
          targetLanguage,
          engineConfig: {
            engineId: (selectedTextModel?.engine || 'gemini') as
              | 'gemini'
              | 'openrouter',
            modelId:
              selectedTextModel?.hf_id || 'googleai/gemini-1.5-flash-latest',
            userApiKey: userProfile?.preferences?.openRouterApiKey,
          },
        });

        if (result.success && result.data) {
          form.setValue('name', result.data.name);
          form.setValue('archetype', result.data.archetype);
          form.setValue('biography', result.data.biography);
          form.setValue('equipment', result.data.equipment);
          form.setValue(
            'physicalDescription',
            result.data.physicalDescription
          );
          form.setValue('originalDescription', description);
          form.setValue('textEngine', selectedTextModel?.engine);
          setCurrentStep('details');
          toast({
            title: 'Details Forged!',
            description:
              'Review the generated text, then create the portrait.',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Generation Failed',
            description: result.error,
          });
        }
      });
    }

    if (currentStep === 'details') {
      const isValid = await form.trigger('physicalDescription');
      if (!isValid) {
        toast({
          variant: 'destructive',
          title: 'Image Prompt Required',
          description: "The physical description can't be empty.",
        });
        return;
      }
      setCurrentStep('portrait');
    }

    if (currentStep === 'portrait') {
      const isValid = await form.trigger('selectedModel');
      if (!isValid) {
        toast({
          variant: 'destructive',
          title: 'Model Required',
          description: 'Please select a base model for generation.',
        });
        return;
      }

      startProcessingTransition(async () => {
        const result = await generateCharacterPortrait(form.getValues());
        if (result.success && result.imageUrl) {
          form.setValue('imageUrl', result.imageUrl);
          form.setValue('imageEngine', form.getValues('selectedModel')?.engine);
          setCurrentStep('complete');
          toast({
            title: 'Portrait Generated!',
            description: 'Your character is ready to be saved.',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Portrait Failed',
            description: result.error,
          });
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
          rarity: formData.rarity,
          birthYear: formData.birthYear,
          weaknesses: formData.weaknesses,
        });
        if (result.success && result.characterId) {
          toast({
            title: 'Character Saved!',
            description: `${formData.name} is now in your armory.`,
          });
          router.push(`/characters/${result.characterId}/edit`);
        } else {
          throw new Error('Failed to save character.');
        }
      } catch (err: unknown) {
        toast({
          variant: 'destructive',
          title: 'Save Failed',
          description:
            err instanceof Error ? err.message : 'An unknown error occurred.',
        });
      }
    });
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'concept':
        return (
          <ConceptStep
            form={form}
            onUseDataPack={() => setCurrentView('datapack-selector')}
            activePack={activePack}
            selectedTemplate={selectedTemplate}
            handleWizardDataChange={handleWizardComplete}
          />
        );
      case 'details':
        return <DetailsStep form={form} />;
      case 'portrait':
        return (
          <PortraitStep
            form={form}
            models={availableModels}
            loras={availableLoras}
            isLoadingModels={isLoadingModels}
          />
        );
      case 'complete':
        return <CompleteStep form={form} onSave={onSave} isSaving={isSaving} />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'generator':
        return (
          <motion.div
            key="generator"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full"
          >
            <Form {...form}>
              <form onSubmit={(e) => e.preventDefault()}>
                <Card className="shadow-lg">
                  <CardContent className="p-4 sm:p-6">
                    {renderStep()}
                  </CardContent>
                  <CardFooter className="pt-4 border-t flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setCurrentStep((prev) =>
                          prev === 'details'
                            ? 'concept'
                            : prev === 'portrait'
                            ? 'details'
                            : 'portrait'
                        )
                      }
                      disabled={currentStep === 'concept' || isProcessing}
                    >
                      <ArrowLeft /> Back
                    </Button>
                    {currentStep !== 'complete' ? (
                      <Button onClick={handleNextStep} disabled={isProcessing || !authUser}>
                        {isProcessing ? (
                          <Loader2 className="animate-spin" />
                        ) : currentStep === 'portrait' ? (
                          <Wand2 />
                        ) : (
                          <ArrowRight />
                        )}
                        {isProcessing
                          ? 'Forging...'
                          : currentStep === 'concept'
                          ? 'Next: Generate Details'
                          : currentStep === 'details'
                          ? 'Next: Generate Portrait'
                          : 'Generate Portrait'}
                      </Button>
                    ) : (
                      <div></div>
                    )}
                  </CardFooter>
                </Card>
              </form>
            </Form>
          </motion.div>
        );
      case 'datapack-selector':
        return (
          <DataPackSelector
            onBack={() => setCurrentView('generator')}
            onSelectPack={(pack) => {
              setActivePack(pack);
              setCurrentView('datapack-wizard');
            }}
          />
        );
      case 'datapack-wizard':
        if (!activePack) {
          setCurrentView('datapack-selector');
          return null;
        }
        return (
          <DataPackSelector.Wizard
            pack={activePack}
            onWizardComplete={handleWizardComplete}
            onBack={() => setCurrentView('datapack-selector')}
          />
        );
      default:
        return null;
    }
  };

  if (isLoadingModels) {
    return (
      <div className="flex justify-center items-center p-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>;
}
