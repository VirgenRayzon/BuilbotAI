import { z } from 'zod';

export const contactSubjects = [
  'Hardware Compatibility Inquiry',
  'Custom Build Commission',
  'Order & Reservation Status',
  'Component Availability & Stock',
  'Technical Support & Warranty',
  'Other Inquiry',
] as const;

export const contactSubmissionSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  subject: z.enum(contactSubjects),
  message: z.string().trim().min(10).max(5000),
  companyWebsite: z.string().max(200).optional().default(''),
});

export const contactReplySchema = z.object({
  inquiryId: z.string().min(10).max(128),
  body: z.string().trim().min(1).max(5000),
});

export const contactStatusSchema = z.object({
  inquiryId: z.string().min(10).max(128),
  status: z.enum(['open', 'resolved']),
});

export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;
