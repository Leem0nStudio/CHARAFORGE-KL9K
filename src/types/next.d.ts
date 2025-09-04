
// This file contains global type helpers for Next.js specific patterns.

/**
 * A generic type for defining props in dynamic route pages in Next.js 15+ App Router.
 * It correctly types the `params` object as a Promise that needs to be awaited.
 * 
 * @example
 * import { AsyncParams } from '@/types/next';
 * 
 * export default async function Page({ params }: AsyncParams<{ id: string }>) {
 *   const { id } = await params;
 *   return <div>ID: {id}</div>;
 * }
 */
export type AsyncParams<T> = {
  params: Promise<T>;
};
