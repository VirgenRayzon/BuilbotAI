# Authentication and access flowcharts

## Customer identity

```mermaid
flowchart TD
  Start([Customer entry]) --> Choice{Sign in, sign up, or reset?}
  Choice -- Sign in --> Input[/Email, password, remember choice or Google/]
  Input --> Valid{Form valid and Firebase Auth succeeds?}
  Valid -- No --> Error[/Inline or provider error; stay on form/] --> Input
  Valid -- Yes --> ServerProfile[Read users UID profile from server]
  ServerProfile --> Staff{Staff profile?}
  Staff -- Yes --> Reject[Sign out; show System Access message] --> StaffPage([System Access route available])
  Staff -- No --> Claims[Attempt customer claim synchronization]
  Claims --> Persist[Set local or session persistence]
  Persist --> Builder([Navigate to builder])
  Choice -- Sign up --> Terms[/Name, email, password, terms checkbox/]
  Terms --> TermsModal{Terms accepted?}
  TermsModal -- No --> Block[/Validation or terms modal; remain on form/] --> Terms
  TermsModal -- Yes --> Create{Firebase registration succeeds?}
  Create -- No --> SignupError[/Error; remain on form/] --> Terms
  Create -- Yes --> UserDoc[Create users UID profile; sync claims] --> Builder
  Choice -- Reset --> Reset[/Enter email/]
  Reset --> ResetValid{Valid address and reset request succeeds?}
  ResetValid -- No --> ResetError[/Error on reset page/] --> Reset
  ResetValid -- Yes --> ResetDone([Reset email requested])
```

Google customer auth follows the same staff rejection and profile path. Popup cancellation and provider errors return to the form. Sources: `src/app/signin/page.tsx`, `src/app/signup/page.tsx`, `src/app/forgot-password/page.tsx`, `src/firebase/auth/google-auth.tsx`, `src/components/auth/terms-of-agreement-modal.tsx`.

## Staff access and guards

```mermaid
flowchart TD
  Entry([System Access]) --> Role{Manager or Super Admin tab?}
  Role --> Credentials[/Email and password plus role key, or Google popup/]
  Credentials --> Auth{Firebase Auth succeeds?}
  Auth -- No --> FormError[/Show error; remain on form/]
  Auth -- Google --> KeyModal[/Role key modal/]
  KeyModal -- Cancel or close --> SignOutGoogle[Sign out temporary Google session] --> Entry
  KeyModal -- Verify --> ServerKey[Send ID token, key and requested role to server action]
  Auth -- Email and password --> ServerKey
  ServerKey --> KeyValid{Profile and key accepted?}
  KeyValid -- No --> SignOutFailed[Clear marker and sign out; show error] --> Entry
  KeyValid -- Yes --> RoleWrite[Update profile and attempt custom claims]
  RoleWrite --> Marker[Store UID in tab session marker]
  Marker --> Admin([Admin dashboard])
  Entry --> Register{Manager registration?}
  Register -- Yes --> ManagerForm[/Account details plus manager key/]
  ManagerForm --> RegisterAction{Firebase account and server key validation succeed?}
  RegisterAction -- No --> RegisterError[/Show error; clear staff marker/] --> ManagerForm
  RegisterAction -- Yes --> Marker
  Entry --> RequestKey[/Request key modal/]
  RequestKey --> RequestValid{Valid request and Firestore write?}
  RequestValid -- No --> RequestError[/Keep modal with error/]
  RequestValid -- Yes --> RequestDone([Request recorded])
  Admin --> Guard{Live profile, permission, marker valid?}
  Guard -- No --> Deny[Withhold protected UI; redirect or sign out] --> Entry
  Guard -- Yes --> Admin
  Admin --> Idle{Idle warning?}
  Idle -- Stay logged in --> Admin
  Idle -- Logout or timeout --> Exit([Sign out])
```

The live profile is read from `users/{uid}` and client roles are derived by `getEffectiveRole`; Firestore rules use custom claims for privileged writes. The guard is a client navigation guard, while server actions and Firestore rules have separate checks. Sources: `src/app/system-access/page.tsx`, `src/app/system-access/signup/page.tsx`, `src/app/actions.ts` (`authenticateSystemAccessAction`, `registerManagerAction`), `src/context/user-profile.tsx`, `src/lib/auth-utils.ts`, `src/components/auth/route-guard.tsx`, `src/hooks/use-admin-session-guard.ts`, `src/components/auth/session-timeout.tsx`, `firestore.rules`.
