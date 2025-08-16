
import { getModels } from "@/app/actions/ai-models";
import { AdminPageLayout } from "@/components/admin/admin-page-layout";
import { ModelForm } from "@/components/admin/model-form";
import { ModelCard } from "@/components/admin/model-card";

export default async function AiModelsPage() {
    const [allModels, allLoras] = await Promise.all([
        getModels('model'),
        getModels('lora')
    ]);

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
                            <ModelCard key={model.id} model={model} />
                        ))}
                    </div>
                     {allModels.length === 0 && <p className="text-muted-foreground text-sm">No base models added yet.</p>}
                </section>
                <section>
                    <h2 className="text-xl font-semibold mb-4">LoRAs</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {allLoras.map((lora) => (
                           <ModelCard key={lora.id} model={lora} />
                        ))}
                    </div>
                    {allLoras.length === 0 && <p className="text-muted-foreground text-sm">No LoRAs added yet.</p>}
                </section>
            </div>
        </AdminPageLayout>
    );
}
