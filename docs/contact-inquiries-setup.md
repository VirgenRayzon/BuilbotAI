# BuildbotAI in-app support

Support inquiries and replies are stored in Firestore and handled inside BuildbotAI. Managers and super admins use **Profile → Contact Inbox**; signed-in customers use **Support Requests**. Staff replies and status changes create in-app notifications for the associated account.

Guest inquiries are accepted and visible to staff, but guests cannot view staff replies in the app and receive no email updates. The Contact page tells guests to sign in before submitting if they want to continue the conversation. Staff reply composition is disabled for guest-only inquiries so messages are not sent into an unreadable thread.

## Email integration

The Gmail integration code is intentionally retained but disabled by `CONTACT_EMAIL_ENABLED` in `src/lib/contact-config.ts`. The UI does not expose Gmail setup or email retry, support APIs do not send messages, and inbound Gmail push events are ignored. Do not configure Gmail OAuth or Pub/Sub for this workflow. To re-enable it in the future, change the feature flag only as part of a reviewed implementation and complete the original Gmail security and deployment setup first.

## Firestore

Deploy `firestore.rules` and `firestore.indexes.json` when setting up a new environment. Contact records and messages are written by server routes. Managers and super admins can read the shared inbox; signed-in customers can read only conversations associated with their own UID. Customer notification records remain under each user's notifications subcollection.

## Cancellation requests

The reservation cancellation action opens the Contact page with a cancellation subject. Submitting while signed in creates an account-linked support conversation, not an email. Staff can respond and update its status from the Contact Inbox; the customer sees replies and status notifications in BuildbotAI.
