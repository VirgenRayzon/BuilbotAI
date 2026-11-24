# Directive: Admin Session Persistence and Idle Timeout SOP

## Purpose
This document defines the Standard Operating Procedure (SOP) for session persistence, tab/window closure behavior, idle timeout enforcement, and multi-tab synchronization within Buildbot AI.

## Security Rationale
In enterprise e-commerce and administrative SaaS environments, privileged accounts (Super Admins and Managers) hold access to sensitive inventory, financial telemetry, audit logs, and internal credentials. 
- **Tab/Window Closure**: Privileged sessions must NEVER linger across browser restarts or after closing the browser tab/window on shared workstations.
- **Inactivity Timeout**: Unattended privileged workstations must automatically invalidate their active session after a strict period of inactivity.

---

## Technical Architecture

### 1. Persistence Tiers
| Role | Portal Route | Firebase Auth Persistence | Storage Location | Tab/Window Close Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `/system-access` | `browserSessionPersistence` | `sessionStorage` | Session terminates immediately upon tab/window close. |
| **Manager** | `/system-access` | `browserSessionPersistence` | `sessionStorage` | Session terminates immediately upon tab/window close. |
| **Client / User** | `/signin` | `browserSessionPersistence` during verification; `browserLocalPersistence` only after verification when Remember me is selected | `sessionStorage`, then `indexedDB` if selected | A verified remembered customer session persists across browser restarts. |

### 2. Tab & Window Close Detection (`useAdminSessionGuard`)
Firebase Web SDK's `browserSessionPersistence` scopes credentials to `sessionStorage`. To guard against legacy cached IndexedDB tokens from older logins:
1. The `/system-access` flow writes `sessionStorage.setItem('buildbot_admin_session_active', uid)` only after successful access-key verification.
2. The admin route guard requires this marker for the current UID. The session guard signs out staff whose marker is absent or belongs to a different UID; it never creates a marker on its own.
3. When the tab/window closes, the staff Auth session and marker are cleared. A legacy locally persisted staff session without a matching marker is signed out on restoration.

The marker is a client navigation safeguard, not a server-side second factor. Firestore rules currently authorize staff data operations with persistent Firebase custom claims. Requiring the access key for direct Firestore access needs a server-enforced, session-scoped authorization design.

### Role resolution on page load

Firebase Auth restores the user before the Firestore `users/{uid}` role profile is confirmed. `UserProfileProvider` keeps each profile result tied to its Auth UID and waits for a server-confirmed snapshot before exposing a role. `AppLayout` shows one neutral account-verification state during that interval; it does not mount role-specific navigation or page content. Next.js route loading uses the same loader design. Do not add a second animated full-page overlay for auth or landing redirects. A missing profile or failed verification shows a retryable account error instead of falling back to the customer role. `RouteGuard` makes access decisions only after this state resolves. On account switching, the admin session guard validates the marker again for the new UID.

Do not use cached profile flags, a previous UID's profile, or an Auth user without a resolved profile to choose dashboard navigation. Firestore custom claims and rules remain the authority for data operations.

During a customer sign-in already in progress, keep the `/signin` form mounted while the new Auth user and profile resolve. Unmounting it resets the submit spinner and briefly shows the form again before `/builder`. The submit handler owns the successful navigation; the existing-session effect should not issue a second redirect. Keep the form in its submitting state until navigation completes.

The existing-session placeholder condition must require both submit flags to be false, even when `redirectingRef.current` is true. A successful submit sets that ref before route navigation finishes; an unconditional `|| redirectingRef.current` branch replaces the active form with a second verification screen. The production role-navigation tests watch for this interruption.

The sign-in operation guard must survive a transient component remount: otherwise the existing-session effect can route to `/builder` before Firebase finishes moving a verified customer session to the selected persistence tier. The shared layout should leave `/signin` mounted during profile verification. After manual sign-out, use a full-page redirect once Firebase has cleared Auth; the sign-out transition temporarily unmounts route content and can prevent a client navigation from finishing.

On customer email or Google sign-in, begin with tab-scoped Auth persistence, check refreshed token claims and a server-read Firestore profile, and immediately sign out Manager or Super Admin accounts with an error on the customer form. Do not redirect those accounts to `/system-access` or `/admin`. Only promote a verified customer to the selected persistence tier. If role verification fails after Firebase sign-in, sign out before returning an error. A restored staff session on `/signin` must also be signed out instead of redirected.

Use the same-route `reason=staff_account` notice when rejecting staff credentials. The global account verification state can temporarily replace and remount the sign-in page as Firebase Auth signs out; a component-local error alone can disappear.

The public `syncUserClaimsAction` must reject staff profiles and must not issue staff claims without the System Access key check.

System Access credential verification uses the stable `POST /api/system-access/authenticate` route, not a generated Next.js Server Action reference. This prevents an idle-timeout page that survived a development recompile or deployment from submitting an obsolete action ID. The route accepts the Firebase ID token only through the `Authorization: Bearer` header and validates the role/key request body with Zod.

### 3. Idle Inactivity Engine (`useIdleTimeout`)
Instead of fragile in-memory `setTimeout` constructs that get throttled or suspended in background tabs, the idle engine uses a timestamp-driven heartbeat:
- **Activity Tracking**: Listens to `mousemove`, `mousedown`, `keydown`, `scroll`, and `touchstart` (throttled to 2.5s).
- **Synchronization**: Writes `buildbot_last_activity` to `localStorage` and broadcasts across tabs via `BroadcastChannel('buildbot_auth_activity')`. Activity in Tab A keeps Tab B alive.
- **Heartbeat & Wakeup**: Ticks every 1s and binds to `document.visibilitychange` and `window.focus`. If a laptop is opened after an idle period, the timeout triggers immediately upon focus.
- **Thresholds**:
  - Staff (Super Admin / Manager): **15 minutes** (900s) total, warning displayed at **13 minutes** (120s countdown).
  - Regular Users: **30 minutes** (1800s) total, warning displayed at **25 minutes** (300s countdown).

### 4. Countdown Warning Modal (`SessionTimeout`)
- Powered by Mantine UI (`Modal`, `Paper`, `Progress`, `Button`).
- 100% compliant with Light Mode and Dark Mode contrast requirements.
- Real-time second countdown with animated progress bar.
- Action options:
  - **Stay Signed In**: Refreshes Firebase Auth ID token, resets activity timestamp, dismisses modal, and notifies all open tabs.
  - **Sign Out Now**: Immediate clean sign out with state purge.

### 5. Manual sign-out listener teardown
The shared `AppLayout` sign-out transition must unmount the authenticated header and page content before calling Firebase `signOut`. The existing short transition delay gives React time to unsubscribe from role-protected Firestore listeners (such as staff notifications and admin dashboard collections). Staff notification queries must also require a current authenticated staff profile. Otherwise Firestore can reject a still-active listener after credentials are revoked, and Next.js displays a development error overlay on `/system-access`.

---

## Edge Cases & Handling
1. **Page Refresh (F5 / Ctrl+R)**:
   `sessionStorage` is preserved across page refreshes by modern browsers. The staff member remains securely logged in.
2. **Opening New Admin Tabs via Links (`target="_blank"`)**:
   Modern browsers clone `sessionStorage` to new tabs spawned from the parent tab. In addition, the BroadcastChannel handshake verifies session continuity.
3. **Closing Last Admin Tab**:
   When the last admin tab is closed, `sessionStorage` is destroyed. Any subsequent attempt to access `/admin` prompts a fresh login.
4. **Network Disconnection During Warning**:
   If network disconnects while the countdown is running and hits 0, `signOut` cleans client state locally before redirecting to `/system-access?reason=idle_timeout`.

---

## Verification Checklist
- [ ] Manager/Super Admin logs in at `/system-access` -> tab close terminates session.
- [ ] Client logs in at `/signin` -> tab close preserves session.
- [ ] Idle warning modal appears with working countdown timer.
- [ ] "Stay Signed In" button successfully extends session and resets countdown.
- [ ] Reaching 0 seconds redirects to `/system-access?reason=idle_timeout` with alert banner.
- [ ] No hardcoded dark-only colors; perfect contrast in both Light and Dark themes.
- [ ] Refresh `/builder`, `/admin`, `/admin/prebuilt-builder`, and `/profile` under all three test roles; no other role's navigation appears during startup.
- [ ] Delay Auth restoration and the profile snapshot separately; authorization waits for the current UID's server-confirmed profile.
- [ ] A missing profile or Firestore error produces a retryable verification state without a customer-role fallback.
- [ ] Account switching revalidates the staff session marker; an unauthorized route redirects only once after role resolution.
- [ ] Customer sign-in stays on one continuous submitting state until Builder opens; the verification screen does not replace and remount the form mid-login.
- [ ] Manager and Super Admin credentials entered at `/signin` show a rejection on the same page, create no continuing customer session, and cannot open `/builder`.
- [ ] Route loading and account verification use the same neutral loader; no separate animated full-page overlay appears.
- [ ] Manual Super Admin and Manager sign-out reaches `/system-access` without a Firestore permission error overlay.
