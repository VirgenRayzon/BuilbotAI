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
| **Client / User** | `/signin` | `browserLocalPersistence` | `indexedDB` | Session persists across browser restarts for seamless customer experience. |

### 2. Tab & Window Close Detection (`useAdminSessionGuard`)
Firebase Web SDK's `browserSessionPersistence` scopes credentials to `sessionStorage`. To guard against legacy cached IndexedDB tokens from older logins:
1. Every authenticated staff session marks `sessionStorage.setItem('buildbot_admin_session_active', uid)`.
2. When the user reopens the browser after closing all tabs/windows, `sessionStorage` is empty.
3. The guard sends a probe via `BroadcastChannel('buildbot_admin_session')`. If no other active admin tab acknowledges the session within 150ms, the lingering session is invalidated (`signOut(auth)`), sensitive local state is purged, and the user is redirected to `/system-access?reason=window_closed`.
4. If another admin tab is already active, the existing tab confirms session validity, allowing seamless multi-tab workflow without requiring redundant logins.

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
