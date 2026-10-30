import type { UIMessage } from 'ai';

const categories = [
    ['gpu', /\b(?:gpu|graphics card|video card)\b/i],
    ['cpu', /\b(?:cpu|processor)\b/i],
    ['motherboard', /\b(?:motherboard|mobo)\b/i],
    ['ram', /\b(?:ram|memory)\b/i],
    ['storage', /\b(?:storage|ssd|hard drive)\b/i],
    ['psu', /\b(?:psu|power supply)\b/i],
    ['case', /\b(?:pc case|computer case|chassis)\b/i],
    ['cooler', /\b(?:cpu cooler|cooling)\b/i],
    ['monitor', /\bmonitor\b/i],
    ['keyboard', /\bkeyboard\b/i],
    ['mouse', /\bmouse\b/i],
    ['headset', /\bheadset\b/i],
] as const;

export type ChatRecommendationContext = {
    category: typeof categories[number][0];
    budget: number;
    intendedUse: string;
};

function messageText(message: UIMessage): string {
    if (!Array.isArray(message.parts)) return '';
    return message.parts
        .flatMap(part => part?.type === 'text' && typeof part.text === 'string' ? [part.text.trim()] : [])
        .filter(Boolean)
        .join('\n');
}

function priorInventoryOptions(message: UIMessage): string {
    if (message.role !== 'assistant' || !Array.isArray(message.parts)) return '';
    return message.parts.flatMap(part => {
        const toolPart = part as unknown as { type?: string; state?: string; output?: unknown };
        if (toolPart.type !== 'tool-searchInventory' || toolPart.state !== 'output-available' || !Array.isArray(toolPart.output)) return [];
        const names = toolPart.output.slice(0, 4).flatMap((item: unknown) => {
            if (!item || typeof item !== 'object' || !('name' in item) || typeof item.name !== 'string') return [];
            const price = 'price' in item && typeof item.price === 'number' ? ` (₱${item.price.toLocaleString('en-PH')})` : '';
            return [`${item.name}${price}`];
        });
        return names.length ? [`Previously shown inventory options: ${names.join('; ')}.`] : [];
    }).join('\n');
}

function findCategory(text: string): ChatRecommendationContext['category'] | null {
    return categories.find(([, pattern]) => pattern.test(text))?.[0] ?? null;
}

function findBudget(text: string): number | null {
    const matches = [...text.matchAll(/(?:₱|PHP\s*)?(\d{1,3}(?:,\d{3})+|\d{4,7}|\d{1,3}(?:\.\d+)?\s*k)\b/gi)];
    for (const match of matches.reverse()) {
        const amount = match[1].toLowerCase().includes('k')
            ? Number(match[1].replace(/k|\s/gi, '')) * 1000
            : Number(match[1].replace(/,/g, ''));
        if (amount >= 1000 && amount <= 10_000_000) return amount;
    }
    return null;
}

/** A completed recommendation request can use resolution in place of a stated use case. */
export function getChatRecommendationContext(messages: UIMessage[]): ChatRecommendationContext | null {
    const recent = messages.slice(-16);
    const latestUser = [...recent].reverse().find(message => message.role === 'user');
    if (!latestUser) return null;
    const latestText = messageText(latestUser);
    const latestAssistant = [...recent].reverse().find(message => message.role === 'assistant');
    const assistantText = latestAssistant ? messageText(latestAssistant) : '';
    const recentRequest = recent.some(message => message.role === 'user'
        && /\b(?:recommend|suggest|find|choose|looking for|need|want)\b/i.test(messageText(message))
        && findCategory(messageText(message)) !== null);
    const latestIsRecommendation = /\b(?:recommend|suggest|find|choose|looking for|need|want|just)\b/i.test(latestText)
        && findCategory(latestText) !== null;
    const answeringRecommendation = assistantText.includes('?')
        && /\b(?:budget|use|resolution|gaming|graphics card|gpu|processor|cpu)\b/i.test(assistantText)
        && /(?:₱|\d|\b(?:gaming|editing|rendering|office|school|development|programming|design|just|gpu|cpu)\b)/i.test(latestText)
        && (findCategory(assistantText) !== null || recentRequest);
    if (!latestIsRecommendation && !answeringRecommendation) return null;

    const userTexts = recent.filter(message => message.role === 'user').map(messageText);
    const category = findCategory(latestText) ?? findCategory(assistantText)
        ?? [...userTexts].reverse().map(findCategory).find(Boolean);
    const budget = [...userTexts].reverse().map(findBudget).find(value => value !== null);
    const intendedUse = [...userTexts].reverse()
        .map(text => text.match(/\b(?:1080p|1440p|4k|gaming|streaming|video editing|photo editing|3d rendering|office work|school work|development|programming|design)\b/i)?.[0])
        .find(Boolean);
    if (!category || !budget || !intendedUse) return null;
    return { category, budget, intendedUse };
}

/** Old streamed tool steps are display history, not safe Gemini conversation turns. */
export function getChatModelHistory(messages: UIMessage[]): UIMessage[] {
    const textMessages = messages.flatMap(message => {
        if (message.role !== 'user' && message.role !== 'assistant') return [];
        const text = [messageText(message), priorInventoryOptions(message)].filter(Boolean).join('\n');
        return text ? [{ id: message.id, role: message.role, parts: [{ type: 'text' as const, text }] }] : [];
    }).slice(-24);
    while (textMessages[0]?.role === 'assistant') textMessages.shift();

    const combined: UIMessage[] = [];
    for (const message of textMessages) {
        const previous = combined.at(-1);
        if (previous?.role === message.role) {
            previous.parts = [{ type: 'text', text: `${messageText(previous)}\n${messageText(message)}` }];
        } else {
            combined.push(message);
        }
    }
    while (combined.at(-1)?.role === 'assistant') combined.pop();
    return combined;
}
