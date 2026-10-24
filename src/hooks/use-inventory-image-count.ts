'use client';

import { useMediaQuery } from '@mantine/hooks';

/** Match the existing grid's first row, rather than prioritizing four on mobile. */
export function useInventoryImageCount(mode: 'admin' | 'builder', wide = false) {
  const sm = useMediaQuery('(min-width: 640px)', false, { getInitialValueInEffect: false });
  const md = useMediaQuery('(min-width: 768px)', false, { getInitialValueInEffect: false });
  const lg = useMediaQuery('(min-width: 1024px)', false, { getInitialValueInEffect: false });
  const xl = useMediaQuery('(min-width: 1280px)', false, { getInitialValueInEffect: false });
  if (mode === 'admin') return lg ? 4 : md ? 3 : sm ? 2 : 1;
  return xl ? (wide ? 5 : 4) : lg ? (wide ? 4 : 3) : md && wide ? 3 : sm ? 2 : 1;
}
