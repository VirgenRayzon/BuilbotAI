export type ContactInquiryStatus = 'open' | 'resolved';
export type ContactMessageSender = 'customer' | 'staff';
export type ContactEmailStatus = 'not_applicable' | 'pending' | 'sent' | 'failed';

export interface ContactInquiry {
  id: string;
  fullName: string;
  email: string;
  accountEmail?: string;
  userId: string | null;
  subject: string;
  status: ContactInquiryStatus;
  messageCount: number;
  lastMessagePreview: string;
  createdAt: unknown;
  updatedAt: unknown;
  lastMessageAt: unknown;
  readBy: string[];
  gmailThreadId?: string;
}

export interface ContactMessage {
  id: string;
  body: string;
  senderType: ContactMessageSender;
  senderId: string | null;
  senderName: string;
  createdAt: unknown;
  emailStatus: ContactEmailStatus;
  emailError?: string;
  gmailMessageId?: string;
}
