
'use server';

import { getPublicDataPacks } from '@/app/actions/datapacks';
import { DataPackStore } from '@/components/datapack/data-pack-store';

export default async function DataPacksPage() {
    const dataPacks = await getPublicDataPacks();

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
            <DataPackStore dataPacks={dataPacks} />
        </div>
    );
}
