
import { EditDataPackForm } from '@/app/admin/datapacks/[id]/edit-datapack-form';

export default async function EditDataPackPage({ params }: { params: { id: string } }) {
  // The form component now handles its own data fetching.
  // We just need to pass the ID from the URL.
  return <EditDataPackForm packId={params.id} />;
}
