import { notFound } from 'next/navigation';
import { getDataPackForAdmin } from '@/app/actions/datapacks';
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
    data = await getDataPackForAdmin(id);
    if (!data) {
      notFound();
    }
  }

  const title = isNew ? 'Create DataPack' : `Edit: ${data?.name || 'DataPack'}`;
  
  return (
    <AdminPageLayout title={title}>
      <EditDataPackForm
        initialData={data}
      />
    </AdminPageLayout>
  );
}
