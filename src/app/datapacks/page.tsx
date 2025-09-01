// This page will display a list of all public DataPacks available in the marketplace.
'use server';
import { getPublicDataPacks } from '@/app/actions/datapacks';
import { DataPackStore } from '@/components/datapack/data-pack-store';

export default async function DatapacksPage() {
  const datapacks = await getPublicDataPacks();

  return (
    <DataPackStore dataPacks={datapacks} />
  );
};
