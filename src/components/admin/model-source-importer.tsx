'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { addAiModelFromSource } from '@/app/actions/ai-models';
import type { UpsertAiModel } from '@/types/ai-model';

type ModelSourceImporterProps = {
    onDataFetched: (data: Partial<UpsertAiModel>) => void;
};

export const ModelSourceImporter = ({ onDataFetched }: ModelSourceImporterProps) => {
    const [source, setSource] = useState<'civitai' | 'modelslab'>('civitai');
    const [sourceId, setSourceId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleFetch = async () => {
        if (!sourceId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a Model ID or URL.' });
            return;
        }

        setIsLoading(true);
        try {
            const result = await addAiModelFromSource(source, sourceId);
            if (result.success && result.data) {
                toast({ title: 'Success', description: result.message });
                onDataFetched(result.data as Partial<UpsertAiModel>);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast({ variant: 'destructive', title: 'Fetch Failed', description: message });
        }
        setIsLoading(false);
    };

    const handleSourceChange = (value: string) => {
        setSource(value as 'civitai' | 'modelslab');
    };

    return (
        <div className="border rounded-lg p-4 mb-6 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="text-lg font-semibold mb-3">Import Model from Source</h3>
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="w-full sm:w-1/4">
                    <Label htmlFor="source-select">Source</Label>
                    <Select value={source} onValueChange={handleSourceChange}>
                        <SelectTrigger id="source-select">
                            <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="civitai">Civitai</SelectItem>
                            <SelectItem value="modelslab">ModelsLab</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-grow">
                    <Label htmlFor="source-id">Model ID or URL</Label>
                    <Input
                        id="source-id"
                        type="text"
                        value={sourceId}
                        onChange={(e) => setSourceId(e.target.value)}
                        placeholder={`Enter ${source === 'civitai' ? 'Civitai' : 'ModelsLab'} model ID or URL`}
                    />
                </div>
                <div className="self-end">
                    <Button onClick={handleFetch} disabled={isLoading} className="w-full sm:w-auto">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                        Fetch Data
                    </Button>
                </div>
            </div>
        </div>
    );
};
