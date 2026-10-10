import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { UIMessageChunk } from 'ai';
import { ChatStreamFailure, forwardTunedChatStream, looksCutOff } from './chat-stream-fallback';

test('shows the first text bubble before a later bubble finishes', async () => {
    let source!: ReadableStreamDefaultController<UIMessageChunk>;
    let firstWritten!: () => void;
    const firstVisible = new Promise<void>(resolve => { firstWritten = resolve; });
    const written: UIMessageChunk[] = [];
    const stream = new ReadableStream<UIMessageChunk>({ start(controller) { source = controller; } });
    const operation = forwardTunedChatStream(stream, new AbortController(), 1000, chunk => {
        written.push(chunk);
        if (chunk.type === 'text-delta' && chunk.delta === 'First') firstWritten();
    });

    source.enqueue({ type: 'start' });
    source.enqueue({ type: 'text-start', id: 'first' });
    source.enqueue({ type: 'text-delta', id: 'first', delta: 'First' });
    await firstVisible;
    assert.deepEqual(written.map(chunk => chunk.type), ['start', 'text-start', 'text-delta']);

    source.enqueue({ type: 'text-end', id: 'first' });
    source.enqueue({ type: 'start-step' });
    source.enqueue({ type: 'text-start', id: 'second' });
    source.enqueue({ type: 'text-delta', id: 'second', delta: 'Second' });
    source.enqueue({ type: 'text-end', id: 'second' });
    source.enqueue({ type: 'finish', finishReason: 'stop' });
    source.close();
    await operation;
    assert.deepEqual(written.filter(chunk => chunk.type === 'text-delta').map(chunk => chunk.delta), ['First', 'Second']);
});

test('keeps fallback available when the tuned model stalls before visible content', async () => {
    const model = new AbortController();
    const written: UIMessageChunk[] = [];
    const stream = new ReadableStream<UIMessageChunk>({
        start(controller) { controller.enqueue({ type: 'start' }); },
    });

    await assert.rejects(
        forwardTunedChatStream(stream, model, 20, chunk => written.push(chunk)),
        (error: unknown) => error instanceof ChatStreamFailure && !error.hasShownContent,
    );
    assert.deepEqual(written, []);
    assert.equal(model.signal.aborted, true);
});

test('reports a stall after visible text without replacing that text', async () => {
    const model = new AbortController();
    const written: UIMessageChunk[] = [];
    const stream = new ReadableStream<UIMessageChunk>({
        start(controller) {
            controller.enqueue({ type: 'text-start', id: 'answer' });
            controller.enqueue({ type: 'text-delta', id: 'answer', delta: 'Partial answer' });
        },
    });

    await assert.rejects(
        forwardTunedChatStream(stream, model, 20, chunk => written.push(chunk)),
        (error: unknown) => error instanceof ChatStreamFailure && error.hasShownContent,
    );
    assert.equal(written.some(chunk => chunk.type === 'text-delta'), true);
    assert.equal(model.signal.aborted, true);
});

test('rejects an empty completion before anything appears', async () => {
    const stream = new ReadableStream<UIMessageChunk>({
        start(controller) {
            controller.enqueue({ type: 'finish', finishReason: 'other' });
            controller.close();
        },
    });

    await assert.rejects(
        forwardTunedChatStream(stream, new AbortController(), 100, () => {}),
        (error: unknown) => error instanceof ChatStreamFailure && !error.hasShownContent,
    );
});

test('recognizes an answer that ends mid-sentence despite a stop finish', async () => {
    assert.equal(looksCutOff('Considering your current top-tier setup, a'), true);
    assert.equal(looksCutOff('Your 850W PSU has ample headroom.'), false);

    const written: UIMessageChunk[] = [];
    const stream = new ReadableStream<UIMessageChunk>({
        start(controller) {
            controller.enqueue({ type: 'start' });
            controller.enqueue({ type: 'text-start', id: 'answer' });
            controller.enqueue({ type: 'text-delta', id: 'answer', delta: 'Considering your setup, a' });
            controller.enqueue({ type: 'text-end', id: 'answer' });
            controller.enqueue({ type: 'finish', finishReason: 'stop' });
            controller.close();
        },
    });

    await assert.rejects(
        forwardTunedChatStream(stream, new AbortController(), 100, chunk => written.push(chunk)),
        (error: unknown) => error instanceof ChatStreamFailure
            && error.hasShownContent
            && error.partialText === 'Considering your setup, a',
    );
    assert.equal(written.some(chunk => chunk.type === 'finish'), false);
});

test('treats token-limit finishes as incomplete even after visible text', async () => {
    const stream = new ReadableStream<UIMessageChunk>({
        start(controller) {
            controller.enqueue({ type: 'text-start', id: 'answer' });
            controller.enqueue({ type: 'text-delta', id: 'answer', delta: 'The best GPU is' });
            controller.enqueue({ type: 'finish', finishReason: 'length' });
            controller.close();
        },
    });
    const written: UIMessageChunk[] = [];
    await assert.rejects(
        forwardTunedChatStream(stream, new AbortController(), 100, chunk => written.push(chunk)),
        (error: unknown) => error instanceof ChatStreamFailure && error.hasShownContent,
    );
    assert.equal(written.at(-1)?.type, 'text-end');
});
