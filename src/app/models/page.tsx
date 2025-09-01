

'use server';

import { getModels } from "@/app/actions/ai-models";
import { AdminPageLayout } from "@/components/admin/admin-page-layout";
import { MediaDisplay } from "@/components/media-display";
import type { AiModel } from "@/types/ai-model";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/back-button";
import { ModelInstallButton } from "./model-install-button";
import { verifyAndGetUid } from "@/lib/auth/server";

export default async function AiModelsPage() {
    let uid: string | null = null;
    try {
        uid = await verifyAndGetUid();
    } catch (error) {
        // User is not logged in, which is fine. They'll just see system models.
    }

    const [allModels, allLoras] = await Promise.all([
        getModels('model', uid || undefined),
        getModels('lora', uid || undefined)
    ]);

    return (
        <div className="container py-8">
            <BackButton 
                title="AI Model Catalog"
                description="Browse and install community and system models to use in the generator."
            />
            <div className="space-y-12 mt-8 max-w-7xl mx-auto">
                <section>
                    <h2 className="text-2xl font-semibold mb-4 font-headline">Base Models</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {allModels.map((model) => (
                            <Card key={model.id} className="overflow-hidden flex flex-col group">
                                <CardHeader className="p-0">
                                     <div className="relative aspect-[4/3] bg-muted/20">
                                         <MediaDisplay
                                            url={model.coverMediaUrl}
                                            type={model.coverMediaType}
                                            alt={model.name}
                                            className="group-hover:scale-105 transition-transform"
                                         />
                                     </div>
                                </CardHeader>
                                <CardContent className="p-4 flex-grow">
                                    <CardTitle className="text-lg">{model.name}</CardTitle>
                                    <CardDescription className="text-xs truncate">{model.hf_id}</CardDescription>
                                </CardContent>
                                <CardFooter className="p-4 pt-0 mt-auto">
                                    <ModelInstallButton modelId={model.id} />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                     {allModels.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No base models available in the catalog yet.</p>}
                </section>
                <section>
                    <h2 className="text-2xl font-semibold mb-4 font-headline">LoRAs</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {allLoras.map((lora) => (
                             <Card key={lora.id} className="overflow-hidden flex flex-col group">
                                <CardHeader className="p-0">
                                     <div className="relative aspect-[4/3] bg-muted/20">
                                         <MediaDisplay
                                            url={lora.coverMediaUrl}
                                            type={lora.coverMediaType}
                                            alt={lora.name}
                                            className="group-hover:scale-105 transition-transform"
                                         />
                                     </div>
                                </CardHeader>
                                <CardContent className="p-4 flex-grow">
                                    <CardTitle className="text-lg">{lora.name}</CardTitle>
                                    <CardDescription className="text-xs truncate">{lora.hf_id || 'No HF ID set'}</CardDescription>
                                    {lora.triggerWords && lora.triggerWords.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {lora.triggerWords.slice(0, 4).map(word => <Badge key={word} variant="outline">{word}</Badge>)}
                                            {lora.triggerWords.length > 4 && <Badge variant="outline">...</Badge>}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="p-4 pt-0 mt-auto">
                                      <ModelInstallButton modelId={lora.id} />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                    {allLoras.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No LoRAs available in the catalog yet.</p>}
                </section>
            </div>
        </div>
    );
}

    
