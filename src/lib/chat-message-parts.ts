import { getToolName, isToolUIPart, type UIMessage } from 'ai';
import type { StructuredPart } from './inventory-fetcher';

type MessagePart = UIMessage['parts'][number];

export type ChatDisplayPart =
    | { kind: 'text'; text: string; firstPartIndex: number; lastPartIndex: number }
    | { kind: 'tool'; part: MessagePart; partIndex: number };

export type RecommendationGroup = { category: string; parts: StructuredPart[] };

function continuesSentence(previous: string, next: string): boolean {
    if (/\n\s*\n\s*$/.test(previous) || /^\s*\n\s*\n/.test(next)) return false;

    const left = previous.trimEnd();
    const right = next.trimStart();
    if (!left || !right) return true;

    return /^[a-z,.;:!?)]/.test(right)
        || /\b(?:a|an|the|and|or|but|to|for|with|of|in|at|on|by|as)$/i.test(left)
        || /[,;:]$/.test(left);
}

function joinText(previous: string, next: string): string {
    if (!previous) return next;
    const separator = /\s$/.test(previous) || /^\s|^[,.;:!?)]/.test(next) ? '' : ' ';
    return previous + separator + next;
}

function firstCompleteExplanation(text: string): string {
    const paragraphs = text.trim().split(/\n\s*\n/).map(paragraph => paragraph.trim()).filter(Boolean);
    if (paragraphs.length <= 1) return text.trim();

    const explanation: string[] = [];
    for (const paragraph of paragraphs) {
        explanation.push(paragraph);
        if (/[.!?]["')\]]?$/.test(paragraph)) break;
    }
    return explanation.join('\n\n');
}

/** Keep the model's meaningful bubble boundaries while joining interrupted sentences. */
export function groupChatMessageParts(parts: UIMessage['parts']): ChatDisplayPart[] {
    const displayParts: ChatDisplayPart[] = [];
    let pendingText: Extract<ChatDisplayPart, { kind: 'text' }> | null = null;

    const flushText = () => {
        if (pendingText) displayParts.push(pendingText);
        pendingText = null;
    };

    parts.forEach((part, partIndex) => {
        if (part.type === 'text') {
            if (pendingText && continuesSentence(pendingText.text, part.text)) {
                pendingText.text = joinText(pendingText.text, part.text);
                pendingText.lastPartIndex = partIndex;
            } else {
                flushText();
                pendingText = { kind: 'text', text: part.text, firstPartIndex: partIndex, lastPartIndex: partIndex };
            }
            return;
        }

        if (part.type === 'step-start') return;

        flushText();
        if (isToolUIPart(part)) displayParts.push({ kind: 'tool', part, partIndex });
    });

    flushText();
    return displayParts;
}

/** A recommendation turn may contain several model steps, but it is one answer. */
export function getRecommendationTurnPresentation(parts: UIMessage['parts']): {
    displayParts: ChatDisplayPart[];
    recommendationGroups: RecommendationGroup[];
} | null {
    const firstSearchIndex = parts.findIndex(part => isToolUIPart(part) && getToolName(part) === 'searchInventory');
    if (firstSearchIndex < 0) return null;

    const groups = new Map<string, Map<string, StructuredPart>>();
    const statusTools = new Map<string, { part: MessagePart; partIndex: number; isComplete: boolean }>();
    let inventorySearchCount = 0;

    parts.forEach((part, partIndex) => {
        if (!isToolUIPart(part)) return;
        const toolName = getToolName(part);
        if (toolName === 'searchInventory') inventorySearchCount += 1;
        statusTools.set(toolName, { part, partIndex, isComplete: part.state === 'output-available' });
        if (toolName !== 'searchInventory' || part.state !== 'output-available' || !Array.isArray(part.output)) return;

        for (const candidate of part.output) {
            if (!candidate || typeof candidate.id !== 'string' || typeof candidate.category !== 'string') continue;
            const category = candidate.category.toLowerCase();
            if (!groups.has(category)) groups.set(category, new Map());
            groups.get(category)!.set(candidate.id, candidate as StructuredPart);
        }
    });

    const recommendationGroups = [...groups].map(([category, matches]) => ({
        category,
        parts: [...matches.values()],
    }));
    const displayParts: ChatDisplayPart[] = [];
    for (const [toolName, status] of statusTools) {
        if (toolName === 'searchInventory' && status.isComplete) continue;
        displayParts.push({ kind: 'tool', part: status.part, partIndex: status.partIndex });
    }

    const afterSearch = parts.slice(firstSearchIndex + 1)
        .map((part, offset) => ({ part, partIndex: firstSearchIndex + offset + 1 }))
        .filter(({ part }) => part.type === 'text' && part.text.trim());
    const visibleTextParts = afterSearch.length > 0
        ? afterSearch
        : parts.slice(0, firstSearchIndex)
            .map((part, partIndex) => ({ part, partIndex }))
            .filter(({ part }) => part.type === 'text' && part.text.trim());

    if (visibleTextParts.length > 0) {
        const answer = visibleTextParts.reduce(
            (text, { part }) => joinText(text, (part as Extract<MessagePart, { type: 'text' }>).text),
            '',
        );
        displayParts.push({
            kind: 'text',
            text: inventorySearchCount > 1 ? firstCompleteExplanation(answer) : answer.trim(),
            firstPartIndex: visibleTextParts[0].partIndex,
            lastPartIndex: visibleTextParts.at(-1)!.partIndex,
        });
    }

    return { displayParts, recommendationGroups };
}
