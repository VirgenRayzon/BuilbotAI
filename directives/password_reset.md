# Password reset verification

## Flow

1. `/forgot-password` calls Firebase Authentication's `sendPasswordResetEmail` for the entered email address.
2. The project uses Firebase's default email action handler. Its page shows the account email and commits the new password when the user presses **Save**.
3. `/signin` calls `signInWithEmailAndPassword` using the email and password entered there. Resetting one email address does not change the password for another account.
4. The forgot-password confirmation repeats the requested email and tells the user to sign in with that same address.

## Verification

Use an isolated test account and a private browser context with no existing session. After completing the emailed action, the old password must be rejected and the new password must be accepted **for the same email address**. Do not infer password acceptance from navigation in a browser with a restored Firebase session.

On 2026-10-12, a temporary account in the configured Firebase project passed this check with its default hosted action handler: old password accepted before reset, rejected after **Save**, and new password accepted after **Save**. The temporary account was deleted.
