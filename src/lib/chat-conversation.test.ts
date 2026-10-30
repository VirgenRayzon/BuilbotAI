import assert from 'node:assert/strict';
import test from 'node:test';
import { convertToModelMessages, type UIMessage } from 'ai';
import { getChatModelHistory, getChatRecommendationContext } from './chat-conversation';

function message(role: 'user' | 'assistant', text: string): UIMessage {
    return { id: `${role}-${text}`, role, parts: [{ type: 'text', text }] };
}

test('uses answers already given instead of asking for GPU details again', () => {
    const conversation = [
        message('user', 'Recommend a GPU for my build'),
        message('assistant', 'What is your budget, monitor resolution and refresh rate, and games?'),
        message('user', '50,000'),
        message('assistant', 'What is your GPU budget and exact resolution?'),
        message('user', '1080p'),
        message('assistant', 'What is your resolution and whether ₱50,000 is for the GPU?'),
        message('user', 'just gpu'),
    ];
    assert.deepEqual(getChatRecommendationContext(conversation), {
        category: 'gpu', budget: 50000, intendedUse: '1080p',
    });
    assert.equal(getChatRecommendationContext([...conversation, message('assistant', 'Here are compatible GPU options.'), message('user', 'thanks')]), null);
    assert.deepEqual(getChatRecommendationContext([
        message('user', 'Recommend a GPU'),
        message('assistant', "What will you use it for, and what's your budget?"),
        message('user', 'Gaming, 50k'),
    ]), { category: 'gpu', budget: 50000, intendedUse: 'Gaming' });
});

test('turns saved tool steps into plain alternating chat history', async () => {
    const conversation: UIMessage[] = [
        message('assistant', 'Welcome!'),
        message('user', 'Find a GPU'),
        {
            id: 'tool-reply', role: 'assistant', parts: [
                { type: 'text', text: 'I found a card.' },
                { type: 'step-start' },
                { type: 'tool-searchInventory', toolCallId: 'call-1', state: 'output-available', input: { category: 'gpu' }, output: [{ name: 'Example GPU', price: 40000 }] },
                { type: 'text', text: 'Here are options.' },
            ],
        } as unknown as UIMessage,
        message('user', 'My budget is 50k.'),
    ];
    const history = getChatModelHistory(conversation);
    assert.deepEqual(history.map(item => item.role), ['user', 'assistant', 'user']);
    const modelMessages = await convertToModelMessages(history);
    assert.deepEqual(modelMessages.map(item => item.role), ['user', 'assistant', 'user']);
    assert.equal(JSON.stringify(modelMessages).includes('tool-call'), false);
    assert.match(JSON.stringify(modelMessages), /Previously shown inventory options: Example GPU/);
});
