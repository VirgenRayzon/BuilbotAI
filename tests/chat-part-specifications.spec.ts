import { expect, test } from '@playwright/test';
import { matchesRequestedPart } from '../src/lib/chat-part-specifications';

test('named products match vector records across hardware categories', () => {
  const matches = [
    ['Intel Core Ultra 7 270K Plus', '[Hardware Spec: CPU] Intel Core Ultra 7 270K Plus 24-Core'],
    ['Sapphire Pulse Radeon RX 9070 GRE OC', '[Hardware Spec: GPU] Sapphire PULSE Radeon RX 9070 GRE OC 12GB'],
    ['ASRock B650M Challenger', '[Hardware Spec: MOTHERBOARD] ASRock B650M Challenger AM5'],
    ['Corsair Vengeance 32GB DDR5-6000', '[Hardware Spec: RAM] Corsair Vengeance DDR5 6000 32 GB'],
    ['Samsung 990 Pro 2TB', '[Hardware Spec: STORAGE] Samsung 990 Pro 2 TB NVMe'],
    ['Corsair RM850x', '[Hardware Spec: PSU] Corsair RM850x 850W Gold'],
    ['NZXT H6 Flow Black', '[Hardware Spec: CASE] NZXT H6 Flow ATX Mid Tower Black'],
    ['Noctua NH-D15 G2', '[Hardware Spec: COOLER] Noctua NH-D15 G2 Air Cooler'],
    ['LG 27GP850-B', '[Hardware Spec: MONITOR] LG 27GP850-B 27 inch Monitor'],
    ['Leopold FC200RR/AB', '[Hardware Spec: KEYBOARD] Leopold FC200RR/AB Mechanical Keyboard'],
    ['Logitech G502 X', '[Hardware Spec: MOUSE] Logitech G502 X Gaming Mouse'],
    ['Razer Tiamat 7.1 V2', '[Hardware Spec: HEADSET] Razer Tiamat 7.1 V2 Headset'],
  ];

  for (const [query, spec] of matches) expect(matchesRequestedPart(query, spec), query).toBe(true);
});

test('nearby models and product variants are not exact matches', () => {
  const mismatches = [
    ['Intel Core Ultra 7 270K Plus', '[Hardware Spec: CPU] Intel Core Ultra 7 265KF'],
    ['Sapphire Pulse Radeon RX 9070 GRE', '[Hardware Spec: GPU] Sapphire PULSE Radeon RX 7900 GRE'],
    ['ASRock B650M Challenger', '[Hardware Spec: MOTHERBOARD] ASRock B650M Pro RS'],
    ['Corsair Vengeance 32GB DDR5-6000', '[Hardware Spec: RAM] Corsair Vengeance 64GB DDR5-6000'],
    ['Samsung 990 Pro 2TB', '[Hardware Spec: STORAGE] Samsung 990 Pro 1TB'],
    ['Corsair RM850x', '[Hardware Spec: PSU] Corsair RM850e'],
    ['NZXT H6 Flow', '[Hardware Spec: CASE] NZXT H6 Flow RGB'],
    ['Noctua NH-D15 G2', '[Hardware Spec: COOLER] Noctua NH-D15'],
    ['LG 27GP850-B', '[Hardware Spec: MONITOR] LG 27GP850'],
    ['Leopold FC200RR/AB', '[Hardware Spec: KEYBOARD] Leopold FC200R'],
    ['Logitech G502 X', '[Hardware Spec: MOUSE] Logitech G502 Hero'],
    ['Razer Tiamat 7.1 V2', '[Hardware Spec: HEADSET] Razer Tiamat 7.1'],
  ];

  for (const [query, spec] of mismatches) expect(matchesRequestedPart(query, spec), query).toBe(false);
});
