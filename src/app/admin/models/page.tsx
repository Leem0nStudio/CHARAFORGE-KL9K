
import { getModels } from "@/app/actions/ai-models";
import { AdminPageLayout } from "@/components/admin/admin-page-layout";
import { ModelForm } from "@/components/admin/model-form";
import { ModelListRealtime } from "@/components/admin/model-list-realtime";

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
                    <ModelListRealtime initialModels={allModels} type="model" />
                </section>
                <section>
                    <h2 className="text-xl font-semibold mb-4">LoRAs</h2>
                    <ModelListRealtime initialModels={allLoras} type="lora" />
                </section>
            </div>
        </AdminPageLayout>
    );
}
