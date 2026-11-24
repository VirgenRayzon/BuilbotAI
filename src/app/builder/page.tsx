import { getBuilderCatalog } from '@/lib/server/builder-catalog';
import type { Part } from '@/lib/types';
import BuilderPage from './builder-page';

export const dynamic = 'force-dynamic';

export default async function BuilderRoute() {
  let initialParts: Part[] | undefined;
  try {
    initialParts = await getBuilderCatalog();
  } catch (error) {
    console.error('Could not prefetch the builder catalog:', error);
  }
  return <BuilderPage initialParts={initialParts} />;
}
