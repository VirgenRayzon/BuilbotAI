export const BUILD_PDF_CATEGORIES = [
  'Motherboard', 'CPU', 'GPU', 'RAM', 'Storage', 'PSU', 'Cooler', 'Case',
  'Monitor', 'Keyboard', 'Mouse', 'Headset',
] as const;

export const BUILD_PDF_REQUIRED = BUILD_PDF_CATEGORIES.slice(0, 8);
export type BuildPdfCategory = (typeof BUILD_PDF_CATEGORIES)[number];
