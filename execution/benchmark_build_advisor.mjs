// Run while `npm run dev` serves http://localhost:9002.
// Prints timings only; it never prints generated recommendations.
const url = process.env.BUILD_ADVISOR_URL || 'http://localhost:9002/api/ai/build-advisor/recommendations';
const body = {
  intendedUse: process.argv[2] || 'Gaming',
  budget: process.argv[3] || '50000',
  performanceLevel: process.argv[4] || '1080p gaming',
  allowFlexibleBudget: false,
  allowAiSearch: process.argv[5] === 'search',
};

const startedAt = performance.now();
const response = await fetch(url, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
  signal: AbortSignal.timeout(130_000),
});
const headersMs = Math.round(performance.now() - startedAt);
let firstByteMs = null;
let bytes = 0;
const chunks = [];
const reader = response.body?.getReader();
if (reader) {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (firstByteMs === null) firstByteMs = Math.round(performance.now() - startedAt);
    bytes += value.byteLength;
    chunks.push(value);
  }
}

const raw = Buffer.concat(chunks).toString('utf8');
let parsed = null;
try { parsed = JSON.parse(raw); } catch { /* A partial or invalid stream is reported below. */ }
const categories = ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler'];
const totalPrice = parsed ? categories.reduce((sum, category) => sum + (parsed[category]?.estimatedPrice || 0), 0) : null;
const budgetNumber = Number(body.budget.replace(/[^\d]/g, ''));

console.log(JSON.stringify({
  status: response.status,
  cache: response.headers.get('x-cache') || 'MISS',
  headersMs,
  firstByteMs,
  completeMs: Math.round(performance.now() - startedAt),
  bytes,
  validJson: !!parsed,
  components: parsed ? categories.filter(category => parsed[category]?.model).length : 0,
  storeIds: parsed ? categories.filter(category => parsed[category]?.partId).length : 0,
  totalPrice,
  withinBudget: response.ok && totalPrice !== null && budgetNumber > 0 ? totalPrice <= budgetNumber : null,
}));
if (!response.ok || !parsed) process.exitCode = 1;
