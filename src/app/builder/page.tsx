import { getBuilderCatalog } from '@/lib/server/builder-catalog';
import type { Part } from '@/lib/types';
import BuilderPage from './builder-page';

// Keep the existing ten-minute server catalog policy; never freeze stock into
// a build-time static page. Public catalog data still sits behind RouteGuard UI.
export const dynamic = 'force-dynamic';

export default async function BuilderRoute() {
  let initialParts: Part[] | undefined;
  try {
    initialParts = await getBuilderCatalog();
  } catch (error) {
    // Retain the existing client retry/empty-state path on a transient failure.
    console.error('Could not prefetch the builder catalog:', error);
  }
  return <BuilderPage initialParts={initialParts} />;
}
