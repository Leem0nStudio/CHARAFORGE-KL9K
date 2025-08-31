// This page provides the interface for creating a new DataPack.

import React from 'react';
import DatapackForm from '@/components/datapack/DatapackForm';

const CreateDatapackPage = () => {
  // In a real implementation, this page would handle form submission
  // and call the upsertDataPack server action.
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Create New DataPack</h1>
      <DatapackForm />
    </div>
  );
};

export default CreateDatapackPage;
