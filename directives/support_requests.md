# Support Requests

## Goal

Show a signed-in customer's most recent support conversations in the Contact Inbox tab of their Profile without a Firestore index error.

## Query rule

1. Filter `contactInquiries` by the authenticated `userId` in Firestore so security rules still scope the listener to that customer.
2. The customer view sorts those results by `lastMessageAt` and displays the latest 50 locally. Adding `orderBy('lastMessageAt')` to the Firestore query requires the composite index in `firestore.indexes.json` to be deployed first.
3. Keep a visible error state when the listener fails. Do not show the empty-state message as if a failed query returned no conversations.
4. Customers, managers, and super administrators use `/profile?tab=contact-inbox`. Render the customer-scoped inbox for customers and the staff-wide inbox for managers and super administrators.
5. Keep `/support-requests` as a redirect to the Profile contact inbox, preserving the optional `inquiry` parameter for old links and bookmarks.

## Verification

1. Run `npm run typecheck` and `npm run lint`.
2. Open `/profile?tab=contact-inbox` on port 9002 with a signed-in customer account and confirm the conversation list loads without the Next.js error overlay.
3. Open `/support-requests?inquiry=<id>` and confirm it redirects to the matching Profile conversation.
