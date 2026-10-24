import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { getAdminFirestore } from '@/firebase/server-init';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';
const SUPPORT_EMAIL = process.env.CONTACT_SUPPORT_EMAIL || 'buildbotaiproject@gmail.com';

export class GmailConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GmailConfigurationError';
  }
}

function oauthSettings() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const redirectUri = process.env.GMAIL_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new GmailConfigurationError(
      'Email is not configured yet. Add the Gmail OAuth client settings on the server.'
    );
  }
  return { clientId, clientSecret, redirectUri };
}

export function createGmailAuthorizationUrl(state: string) {
  const { clientId, clientSecret, redirectUri } = oauthSettings();
  const client = new OAuth2Client(clientId, clientSecret, redirectUri);
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
    ],
    state,
  });
}

export async function exchangeGmailAuthorizationCode(code: string) {
  const { clientId, clientSecret, redirectUri } = oauthSettings();
  const client = new OAuth2Client(clientId, clientSecret, redirectUri);
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) throw new GmailConfigurationError('Google did not return a refresh token. Re-authorize with consent enabled.');
  client.setCredentials(tokens);
  const accessToken = await client.getAccessToken();
  if (!accessToken.token) throw new GmailConfigurationError('Gmail could not verify the authorized mailbox.');
  const response = await fetch(`${GMAIL_API}/profile`, {
    headers: { authorization: `Bearer ${accessToken.token}` },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Gmail could not verify the authorized mailbox.');
  const profile = await response.json() as { emailAddress?: string };
  const expectedEmail = SUPPORT_EMAIL.toLowerCase();
  if (profile.emailAddress?.toLowerCase() !== expectedEmail) {
    throw new GmailConfigurationError(`Authorize ${SUPPORT_EMAIL} so customer replies reach the support inbox.`);
  }
  return tokens.refresh_token;
}

export function encryptGmailRefreshToken(refreshToken: string) {
  const encodedKey = process.env.GMAIL_TOKEN_ENCRYPTION_KEY;
  if (!encodedKey) throw new GmailConfigurationError('Set GMAIL_TOKEN_ENCRYPTION_KEY on the server before authorizing Gmail.');
  const key = Buffer.from(encodedKey, 'base64');
  if (key.length !== 32) throw new GmailConfigurationError('GMAIL_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(refreshToken, 'utf8'), cipher.final()]);
  return { ciphertext: encrypted.toString('base64'), iv: iv.toString('base64'), authTag: cipher.getAuthTag().toString('base64') };
}

async function oauthClient() {
  const { clientId, clientSecret, redirectUri } = oauthSettings();
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN || await loadStoredRefreshToken();
  if (!refreshToken) throw new GmailConfigurationError('Gmail has not been authorized by a super admin yet.');

  const client = new OAuth2Client(clientId, clientSecret, redirectUri);
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

async function loadStoredRefreshToken() {
  const encrypted = await getAdminFirestore().collection('contactSecrets').doc('gmail').get();
  const data = encrypted.data();
  if (!data || typeof data.ciphertext !== 'string' || typeof data.iv !== 'string' || typeof data.authTag !== 'string') return null;
  const encodedKey = process.env.GMAIL_TOKEN_ENCRYPTION_KEY;
  if (!encodedKey) throw new GmailConfigurationError('Set GMAIL_TOKEN_ENCRYPTION_KEY to use the saved Gmail connection.');
  const key = Buffer.from(encodedKey, 'base64');
  if (key.length !== 32) throw new GmailConfigurationError('GMAIL_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.');
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(data.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(data.authTag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(data.ciphertext, 'base64')), decipher.final()]).toString('utf8');
}

async function gmailFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const client = await oauthClient();
  const accessToken = await client.getAccessToken();
  if (!accessToken.token) throw new GmailConfigurationError('Gmail could not refresh its access token.');

  const response = await fetch(`${GMAIL_API}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${accessToken.token}`,
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({})) as { error?: { message?: string } } & T;
  if (!response.ok) {
    throw new Error(payload.error?.message || `Gmail request failed (${response.status}).`);
  }
  return payload;
}

function safeHeader(value: string) {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function wrapBase64(value: string) {
  return value.match(/.{1,76}/g)?.join('\r\n') ?? value;
}

export async function sendInquiryReply(args: {
  to: string;
  customerName: string;
  subject: string;
  body: string;
  replyToken: string;
  threadId?: string;
}) {
  const replyTo = SUPPORT_EMAIL.replace('@', `+reply-${args.replyToken}@`);
  const subject = `Re: ${safeHeader(args.subject)}`;
  const threadHeaders = args.threadId ? await getThreadReplyHeaders(args.threadId) : [];
  const mime = [
    `From: Netcodex Support <${SUPPORT_EMAIL}>`,
    `To: ${safeHeader(args.to)}`,
    `Reply-To: Netcodex Support <${replyTo}>`,
    ...threadHeaders,
    `Subject: =?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrapBase64(Buffer.from(`Hello ${args.customerName},\n\n${args.body}\n\nNetcodex Support`, 'utf8').toString('base64')),
  ].join('\r\n');

  const result = await gmailFetch<{ id: string; threadId: string }>('/messages/send', {
    method: 'POST',
    body: JSON.stringify({
      raw: encodeBase64Url(mime),
      ...(args.threadId ? { threadId: args.threadId } : {}),
    }),
  });
  return { messageId: result.id, threadId: result.threadId };
}

async function getThreadReplyHeaders(threadId: string) {
  const thread = await gmailFetch<{ messages?: Array<{ payload?: { headers?: Array<{ name: string; value: string }> } }> }>(
    `/threads/${encodeURIComponent(threadId)}?format=metadata&metadataHeaders=Message-ID&metadataHeaders=References`
  );
  const messages = thread.messages ?? [];
  const lastMessage = messages[messages.length - 1];
  const headers = lastMessage?.payload?.headers ?? [];
  const messageId = headers.find(header => header.name.toLowerCase() === 'message-id')?.value;
  const references = headers.find(header => header.name.toLowerCase() === 'references')?.value;
  return [
    ...(messageId ? [`In-Reply-To: ${safeHeader(messageId)}`] : []),
    ...(messageId ? [`References: ${safeHeader(references ? `${references} ${messageId}` : messageId)}`] : []),
  ];
}

export async function startGmailWatch() {
  const topicName = process.env.GMAIL_PUBSUB_TOPIC;
  if (!topicName) throw new GmailConfigurationError('Set GMAIL_PUBSUB_TOPIC before enabling incoming email.');

  return gmailFetch<{ historyId: string; expiration: string }>('/watch', {
    method: 'POST',
    body: JSON.stringify({ topicName, labelIds: ['INBOX'], labelFilterBehavior: 'INCLUDE' }),
  });
}

export interface GmailMessageListItem {
  id: string;
  threadId: string;
}

export interface GmailHistoryRecord {
  messagesAdded?: Array<{ message: GmailMessageListItem }>;
}

export async function listGmailHistory(startHistoryId: string, pageToken?: string) {
  const params = new URLSearchParams({ startHistoryId, historyTypes: 'messageAdded', labelId: 'INBOX' });
  if (pageToken) params.set('pageToken', pageToken);
  return gmailFetch<{
    history?: GmailHistoryRecord[];
    historyId: string;
    nextPageToken?: string;
  }>(`/history?${params.toString()}`);
}

export interface GmailMessagePayload {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailMessagePayload[];
}

export interface GmailMessageDetail {
  id: string;
  threadId: string;
  labelIds?: string[];
  payload?: {
    headers?: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: GmailMessagePayload[];
  };
}

export async function getGmailMessage(messageId: string) {
  return gmailFetch<GmailMessageDetail>(`/messages/${encodeURIComponent(messageId)}?format=full`);
}

export function decodeGmailBody(data?: string) {
  if (!data) return '';
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

export function getSupportEmail() {
  return SUPPORT_EMAIL;
}
