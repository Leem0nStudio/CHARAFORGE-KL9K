
import { getModels } from "@/app/actions/ai-models";
import { AdminPageLayout } from "@/components/admin/admin-page-layout";
import { ModelForm } from "@/components/admin/model-form";
import { AiModel } from "@/types/ai-model";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AiModelsPage() {
    const allModels = await getModels('model');
    const allLoras = await getModels('lora');

    return (
        <AdminPageLayout
            title="AI Model Management"
            actions={<ModelForm />}
        >
            <div className="space-y-8">
                <section>
                    <h2 className="text-xl font-semibold mb-4">Base Models</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {allModels.map((model) => (
                            <Card key={model.id} className="overflow-hidden flex flex-col">
                                <CardHeader className="p-0">
                                     <div className="relative aspect-video bg-muted/20">
                                         <Image
                                             src={model.coverImageUrl || `https://placehold.co/1216x832.png`}
                                             alt={model.name}
                                             fill
                                             className="object-cover"
                                             sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                     </div>
                                </CardHeader>
                                <CardContent className="p-4 flex-grow">
                                    <CardTitle className="text-lg">{model.name}</CardTitle>
                                    <CardDescription className="text-xs truncate">{model.hf_id}</CardDescription>
                                </CardContent>
                                <CardFooter className="p-4 pt-0 mt-auto">
                                    <ModelForm isEditing model={model} />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                     {allModels.length === 0 && <p className="text-muted-foreground text-sm">No base models added yet.</p>}
                </section>
                <section>
                    <h2 className="text-xl font-semibold mb-4">LoRAs</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {allLoras.map((lora) => (
                            <Card key={lora.id} className="overflow-hidden flex flex-col">
                                <CardHeader className="p-0">
                                     <div className="relative aspect-video bg-muted/20">
                                         <Image
                                             src={lora.coverImageUrl || `https://placehold.co/1216x832.png`}
                                             alt={lora.name}
                                             fill
                                             className="object-cover"
                                             sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                     </div>
                                </CardHeader>
                                <CardContent className="p-4 flex-grow">
                                    <CardTitle className="text-lg">{lora.name}</CardTitle>
                                    <CardDescription className="text-xs truncate">{lora.hf_id || 'No HF ID set'}</CardDescription>
                                    {lora.triggerWords && lora.triggerWords.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {lora.triggerWords.map(word => <Badge key={word} variant="outline">{word}</Badge>)}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="p-4 pt-0 mt-auto">
                                     <ModelForm isEditing model={lora} />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                    {allLoras.length === 0 && <p className="text-muted-foreground text-sm">No LoRAs added yet.</p>}
                </section>
            </div>
        </AdminPageLayout>
    );
}
