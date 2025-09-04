
import { EditDataPackForm } from '@/app/admin/datapacks/[id]/edit-datapack-form';

// Defining the interface for the page props as expected by Next.js App Router.
interface PageProps {
  params: {
    id: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function EditDataPackPage({ params }: PageProps) {
  // The form component now handles its own data fetching.
  // We just need to pass the ID from the URL.
  return <EditDataPackForm packId={params.id} />;
}
