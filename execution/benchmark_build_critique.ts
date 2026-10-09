// Run with `npx tsx execution/benchmark_build_critique.ts`.
// Uses a fixed example build and prints timing plus response shape only.
import 'dotenv/config';
import { aiBuildCritiqueAction } from '../src/ai/flows/ai-build-critique';

const build = {
  CPU: { model: 'AMD Ryzen 5 5600', price: 6500, socket: 'AM4', performanceScore: 60 },
  GPU: { model: 'NVIDIA GeForce RTX 4060', price: 18500, performanceScore: 65 },
  Motherboard: { model: 'B550 motherboard', price: 6000, socket: 'AM4', ramType: 'DDR4' },
  RAM: [{ model: '16GB DDR4 3200', price: 2500, ramType: 'DDR4' }],
  Storage: [{ model: '1TB NVMe SSD', price: 3500 }],
  PSU: { model: '650W 80+ Bronze PSU', price: 3500, wattage: 650 },
  Case: { model: 'ATX airflow case', price: 2500 },
  Cooler: { model: '120mm tower cooler', price: 1500 },
};

async function main() {
  const startedAt = performance.now();
  try {
    const result = await aiBuildCritiqueAction({ build, intendedUse: 'AAA', performanceLevel: '1080p' });
    console.log(JSON.stringify({
      completeMs: Math.round(performance.now() - startedAt),
      pros: result.pros.length,
      cons: result.cons.length,
      games: result.fpsEstimates.length,
      suggestions: result.suggestions.length,
    }));
  } catch (error) {
    console.error(JSON.stringify({ completeMs: Math.round(performance.now() - startedAt), error: String(error) }));
    process.exitCode = 1;
  }
}

void main();
