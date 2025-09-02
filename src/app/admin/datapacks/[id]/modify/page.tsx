// This page provides the interface for editing an existing DataPack.

import React from 'react';
import DatapackForm from '@/components/datapack/DatapackForm';
import { getDataPackForAdmin } from '@/app/actions/datapacks';

interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

const EditDatapackPage = async ({ params }: PageProps) => {
  const { id } = params;
  const datapack = await getDataPackForAdmin(id);

  if (!datapack) {
    return <div className="container mx-auto p-4">DataPack not found.</div>;
  }

  // In a real implementation, this page would handle form submission
  // and call the upsertDataPack server action, passing the existing datapack data.
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Edit DataPack: {datapack.name}</h1>
      <DatapackForm initialData={datapack} />
    </div>
  );
};

export default EditDatapackPage;
