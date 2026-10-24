import { z } from 'zod';

const text = z.string().max(20000);
const money = z.number().finite().min(0);
const shared = {
  name: z.string().trim().min(1).max(250), price: money,
  description: text.optional(), imageUrl: z.string().max(4000),
  images: z.array(z.string().max(4000)).max(20).optional(),
};
export const partProductSchema = z.object({
  ...shared,
  category: z.enum(['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler', 'Monitor', 'Keyboard', 'Mouse', 'Headset']),
  brand: z.string().trim().min(1).max(200), stock: z.number().int().min(0),
  specifications: z.record(z.union([z.string().max(4000), z.number().finite()])),
  wattage: money.optional(), performanceScore: z.number().min(0).max(100).optional(),
  dimensions: z.object({ width: money, height: money, depth: money }).optional(),
  packageType: z.union([z.enum(['TRAY', 'BOX']), z.literal('')]).transform(value => value || undefined).optional(),
  socket: z.string().max(200).optional(), ramType: z.string().max(200).optional(),
  searchKeywords: z.array(z.string().max(500)).max(10000).optional(),
  isArchived: z.boolean().optional(),
});
const ref = z.string().max(128).regex(/^[\w-]*$/).optional();
export const prebuiltProductSchema = z.object({
  ...shared, tier: z.enum(['Entry', 'Mid-Range', 'High-End', 'Workstation']),
  components: z.object({ cpu: ref, gpu: ref, motherboard: ref, psu: ref, case: ref, cooler: ref,
    ram: z.array(z.string().max(128).regex(/^[\w-]+$/)).max(16),
    storage: z.array(z.string().max(128).regex(/^[\w-]+$/)).max(32),
  }),
});
export const createProductSchema = z.object({
  idToken: z.string().min(1), operationId: z.string().uuid(),
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
}).and(z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('part'), payload: partProductSchema }),
  z.object({ kind: z.literal('prebuilt'), payload: prebuiltProductSchema }),
]));
