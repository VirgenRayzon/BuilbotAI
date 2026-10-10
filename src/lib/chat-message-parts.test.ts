import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { UIMessage } from 'ai';
import { getRecommendationTurnPresentation, groupChatMessageParts } from './chat-message-parts';

test('joins the interrupted sentence across a step boundary', () => {
    const parts: UIMessage['parts'] = [
        { type: 'text', text: 'performance gains would come from an even' },
        { type: 'step-start' },
        { type: 'text', text: 'more powerful GPU.' },
    ];

    assert.deepEqual(groupChatMessageParts(parts), [
        {
            kind: 'text',
            text: 'performance gains would come from an even more powerful GPU.',
            firstPartIndex: 0,
            lastPartIndex: 2,
        },
    ]);
});

test('keeps completed text and tool boundaries separate', () => {
    const parts: UIMessage['parts'] = [
        { type: 'text', text: 'I will check your build.' },
        { type: 'step-start' },
        { type: 'text', text: 'Your selected GPU is compatible.' },
        { type: 'tool-analyzeCurrentBuild', toolCallId: 'check', state: 'output-available', input: {}, output: {} },
        { type: 'text', text: 'Here is the result.' },
    ];

    const display = groupChatMessageParts(parts);
    assert.deepEqual(display.map(part => part.kind), ['text', 'text', 'tool', 'text']);
});

test('shows one answer and one set of cards when inventory is searched twice', () => {
    const gpu = {
        id: 'gpu-1', name: 'Example GPU', brand: 'Example', model: 'Example GPU',
        price: 100000, imageUrl: '', category: 'gpu',
    };
    const parts: UIMessage['parts'] = [
        { type: 'text', text: 'I will look for GPUs now.' },
        { type: 'tool-searchInventory', toolCallId: 'first', state: 'output-available', input: { category: 'gpu' }, output: [gpu] },
        { type: 'step-start' },
        { type: 'text', text: 'A strong option for your build' },
        { type: 'tool-searchInventory', toolCallId: 'second', state: 'output-available', input: { category: 'gpu' }, output: [gpu] },
        { type: 'text', text: 'is shown below.' },
    ];

    const presentation = getRecommendationTurnPresentation(parts);
    assert.deepEqual(presentation?.displayParts.map(part => part.kind), ['text']);
    assert.equal(presentation?.displayParts[0].kind === 'text' && presentation.displayParts[0].text,
        'A strong option for your build is shown below.');
    assert.deepEqual(presentation?.recommendationGroups.map(group => [group.category, group.parts.length]), [['gpu', 1]]);
});

test('keeps the first complete recommendation explanation and drops repeated follow-up copy', () => {
    const parts: UIMessage['parts'] = [
        { type: 'text', text: 'I will search now.' },
        { type: 'tool-searchInventory', toolCallId: 'first', state: 'output-available', input: { category: 'gpu' }, output: [] },
        { type: 'text', text: 'For 4K gaming, your GPU is the best upgrade target.\n\nHere is a card for the GPU.' },
        { type: 'tool-searchInventory', toolCallId: 'second', state: 'output-available', input: { category: 'gpu' }, output: [] },
        { type: 'text', text: 'This GPU is the best upgrade target for 4K gaming.' },
    ];

    const presentation = getRecommendationTurnPresentation(parts);
    assert.deepEqual(presentation?.displayParts.map(part => part.kind), ['text']);
    assert.equal(presentation?.displayParts[0].kind === 'text' && presentation.displayParts[0].text,
        'For 4K gaming, your GPU is the best upgrade target.');
});

test('keeps useful paragraphs for a single inventory search', () => {
    const parts: UIMessage['parts'] = [
        { type: 'tool-searchInventory', toolCallId: 'only', state: 'output-available', input: { category: 'gpu' }, output: [] },
        { type: 'text', text: 'This GPU is compatible.\n\nIt fits the requested budget.' },
    ];

    const presentation = getRecommendationTurnPresentation(parts);
    assert.equal(presentation?.displayParts[0].kind === 'text' && presentation.displayParts[0].text,
        'This GPU is compatible.\n\nIt fits the requested budget.');
});
