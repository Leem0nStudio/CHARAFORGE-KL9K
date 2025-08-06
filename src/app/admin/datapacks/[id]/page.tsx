
import { notFound } from 'next/navigation';
import { getDataPack } from '../actions';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { EditDataPackForm } from './edit-datapack-form';

interface EditDataPackPageProps {
  params: {
    id: string;
  };
}

export default async function EditDataPackPage({ params }: EditDataPackPageProps) {
  const { id } = params;
  const isNew = id === 'new';

  let data = null;
  if (!isNew) {
    data = await getDataPack(id);
    if (!data) {
      notFound();
    }
  }

  const title = isNew ? 'Create DataPack' : 'Edit DataPack';
  const breadcrumbs = [
    { label: 'DataPacks', href: '/admin/datapacks' },
  ];

  return (
    <AdminPageLayout title={title} breadcrumbs={breadcrumbs}>
      <EditDataPackForm
        initialData={data}
      />
    </AdminPageLayout>
  );
}

    