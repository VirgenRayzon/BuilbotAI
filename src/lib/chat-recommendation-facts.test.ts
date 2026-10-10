import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getChatRecommendationFacts } from './chat-recommendation-facts';
import type { StructuredPart } from './inventory-fetcher';

const cpu = (specifications: Record<string, unknown>): StructuredPart => ({
    id: 'cpu-1', name: 'CPU', brand: 'Test', model: 'CPU', category: 'cpu',
    price: 10000, stock: 3, imageUrl: '', specifications,
});

test('uses catalog CPU facts and keeps core counts concise', () => {
    assert.deepEqual(getChatRecommendationFacts(cpu({
        Socket: 'LGA 1700', Cores: '10 (6 P-cores, 4 E-cores)', Threads: 16,
    })), ['LGA 1700 socket', '10 cores', '16 threads']);
});

test('does not invent specifications for sparse catalog entries', () => {
    assert.deepEqual(getChatRecommendationFacts(cpu({ Socket: 'AM5', Cores: 'N/A' })), ['AM5 socket']);
});
