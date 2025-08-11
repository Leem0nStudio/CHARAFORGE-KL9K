
import { getPublicDataPacks } from '@/app/actions/datapacks';
import { DataPackCard } from '@/components/datapack/datapack-card';

export default async function DataPacksPage() {
    const dataPacks = await getPublicDataPacks();

    return (
        <div className="container py-8">
            <div className="mx-auto grid w-full max-w-7xl gap-2 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">DataPacks Catalog</h1>
                    <p className="text-muted-foreground">
                        Browse and select a DataPack to start creating with the Prompt Wizard.
                    </p>
                </div>
            </div>

            {dataPacks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {dataPacks.map(pack => (
                       <DataPackCard key={pack.id} pack={pack} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 min-h-[400px] border-2 border-dashed rounded-lg bg-card/50 max-w-7xl mx-auto">
                    <h2 className="text-2xl font-medium font-headline tracking-wider mb-2">No DataPacks Found</h2>
                    <p className="max-w-xs mx-auto">It seems there are no DataPacks available at the moment. Please check back later or run the seeding script.</p>
                </div>
            )}
        </div>
    );
}
