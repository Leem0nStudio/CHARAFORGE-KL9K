import { EditDataPackForm } from '@/app/admin/datapacks/[id]/edit-datapack-form';
import type { AsyncParams } from '@/types/next';

// Using the global AsyncParams helper to correctly type the props for a Next.js 15 dynamic page.
// The page is async, and we must `await` the params object to access its properties.
export default async function EditDataPackPage({ params }: AsyncParams<{ id: string }>) {
  // Awaiting the params Promise to get the actual route parameters.
  const { id } = await params;

  // The form component handles its own data fetching.
  // We just need to pass the resolved ID from the URL.
  return <EditDataPackForm packId={id} />;
}
