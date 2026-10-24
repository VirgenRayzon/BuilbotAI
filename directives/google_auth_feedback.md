# Google authentication feedback

## Goal

Every completed Google authentication attempt must leave the user with a clear result on the page where it started.

## Rules

1. Firebase popup dismissal codes may remain silent in the shared authentication helper when other routes intentionally ignore them.
2. Customer sign-in must provide a local fallback message when the shared helper returns an unsuccessful result without an error string.
3. The fallback should explain that Google sign-in was cancelled and invite the user to try again.
4. Always clear the Google button loading state after a cancelled or failed attempt.

## Verification

1. Open `/signin` on `http://localhost:9002/`.
2. Select **Continue with Google**, then close the account chooser.
3. Confirm the loading state ends and an authentication alert says the attempt was cancelled.
4. Run `npm run typecheck` and `npm run lint`.
