import { EditDataPackForm } from '@/app/admin/datapacks/[id]/edit-datapack-form';

// The PageProps interface is removed as it's the source of the typing error with Next.js 15.
// The params are now typed inline in the component function signature.

export default async function EditDataPackPage({ params }: { params: { id: string } }) {
  // The form component now handles its own data fetching.
  // We just need to pass the ID from the URL.
  // Next.js automatically resolves the params for async server components.
  return <EditDataPackForm packId={params.id} />;
}
