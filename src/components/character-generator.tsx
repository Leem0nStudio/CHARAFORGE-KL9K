'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wand2, Loader2, Save, ArrowLeft, ArrowRight } from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Form,
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

import { ConceptStep } from './generator/concept-step';
import { DetailsStep } from './generator/details-step';
import { PortraitStep } from './generator/portrait-step';
import { CompleteStep } from './generator/complete-step';


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
  }, [authUser, searchParams, toast, form]);

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
