import type { UIMessageChunk } from 'ai';

export class ChatStreamFailure extends Error {
    constructor(message: string, readonly hasShownContent: boolean, readonly partialText = '') {
        super(message);
        this.name = 'ChatStreamFailure';
    }
}

export function looksCutOff(text: string): boolean {
    const ending = text.trim();
    return /[,;:]$/.test(ending)
        || /\b(?:a|an|the|and|or|but|to|for|with|of|in|at|on|by|as)$/i.test(ending);
}

/**
 * Forward the tuned reply as it arrives. Hold only protocol setup chunks until
 * the first visible content; that leaves room to retry a model that fails
 * before the user has seen any part of its answer.
 */
export async function forwardTunedChatStream(
    stream: ReadableStream<UIMessageChunk>,
    controller: AbortController,
    deadlineMs: number,
    write: (chunk: UIMessageChunk) => void,
): Promise<void> {
    const reader = stream.getReader();
    const pending: UIMessageChunk[] = [];
    let hasShownContent = false;
    let hasFinished = false;
    let succeeded = false;
    let partialText = '';
    const openTextIds = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const deadline = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
            controller.abort();
            reject(new Error(`Chat model did not finish within ${deadlineMs}ms`));
        }, deadlineMs);
    });

    const consume = async () => {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value.type === 'error') throw new Error(value.errorText);
            if (value.type === 'text-start') openTextIds.add(value.id);
            if (value.type === 'text-delta') partialText += value.delta;
            if (value.type === 'text-end') openTextIds.delete(value.id);
            if (value.type === 'finish') {
                if (value.finishReason === 'error') throw new Error('Chat model finished with an error');
                if (value.finishReason !== 'stop') throw new Error(`Chat model finished with reason: ${value.finishReason}`);
                if (looksCutOff(partialText)) throw new Error('Chat model finished with an incomplete sentence');
                hasFinished = true;
            }

            const isVisible = (value.type === 'text-delta' && value.delta.trim().length > 0)
                || value.type === 'tool-input-start'
                || value.type === 'tool-input-available'
                || value.type === 'tool-output-available';
            if (!hasShownContent && !isVisible) {
                pending.push(value);
                continue;
            }
            if (!hasShownContent) {
                pending.forEach(write);
                pending.length = 0;
                hasShownContent = true;
            }
            write(value);
        }

        if (controller.signal.aborted) throw new Error('Chat model was aborted before completing');
        if (!hasFinished) throw new Error('Chat model stream ended without a finish event');
        if (!hasShownContent) throw new Error('Chat model finished without an answer');
        succeeded = true;
    };

    try {
        await Promise.race([consume(), deadline]);
    } catch (error) {
        if (hasShownContent) {
            for (const id of openTextIds) write({ type: 'text-end', id });
        }
        throw new ChatStreamFailure(error instanceof Error ? error.message : String(error), hasShownContent, partialText);
    } finally {
        if (timer) clearTimeout(timer);
        if (!succeeded) {
            controller.abort();
            void reader.cancel().catch(() => {});
        }
        reader.releaseLock();
    }
}
