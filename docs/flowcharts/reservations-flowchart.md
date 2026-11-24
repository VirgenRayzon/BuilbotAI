# Reservation and fulfillment workflows

## Creation

### Simple explanation

This flowchart shows how a new reservation starts. A customer chooses a complete custom build, a ready-made PC, or one available part. The app checks the signed-in user, stock, and needed product details. A valid request creates an order and updates stock in one protected action. The customer and staff can then see the new reservation and its first status.

```mermaid
flowchart TD
  Start([Customer confirms custom build or prebuilt]) --> Call[Call processCheckout or reservePrebuiltSystem]
  Call --> Read[Admin SDK transaction reads canonical inventory items]
  Read --> Stock{Every required item exists and has stock?}
  Stock -- No --> Fail[/Return error; UI shows failure toast/] --> End([Stay in builder or product])
  Stock -- Yes --> Write[Decrement stock; increment popularity]
  Write --> Order[Create pending order]
  Order --> Notice[Create customer and staff notifications plus user audit log]
  Notice --> Commit{Transaction commits?}
  Commit -- No --> Fail
  Commit -- Yes --> Success[/Success toast; clear custom build or navigate to profile/] --> Done([Reservation visible])
  End --> Finish([END])
  Done --> Finish
```

`processCheckout` and `reservePrebuiltSystem` receive customer identifiers and item data as action arguments. They recheck item existence and stock, but neither creation action independently verifies a Firebase ID token. This is a source observation, not a runtime exploit finding (`src/app/checkout-actions.ts`, `src/app/prebuilt-reservation-actions.ts`).

## Status and cancellation

### Simple explanation

This flowchart shows what happens after a reservation is created. Staff can move the order through its allowed status steps. The customer can view the latest status from Profile and related alerts. The current customer Cancel button opens a choice to keep the order or contact staff. Staff can archive or restore records, while permanent delete is limited to the Super Admin.

```mermaid
flowchart TD
  Start([Manager status choice or customer cancellation]) --> Token[Send Firebase ID token to updateReservationStatus]
  Token --> Verify{Token valid and live profile authorizes action?}
  Verify -- No --> Denied[/Return failure and show error/]
  Verify -- Yes --> Load[Read order in transaction]
  Load --> Allowed{Order exists, not archived, transition allowed?}
  Allowed -- No --> Denied
  Allowed -- Yes --> Same{Status unchanged?}
  Same -- Yes --> Done([No new status write])
  Same -- No --> Cancel{New status cancelled?}
  Cancel -- Yes --> Restore[Return reserved stock]
  Cancel -- No --> Update[Set pending, building, or finished building]
  Restore --> Notify[Update order; create notifications and user audit]
  Update --> Notify
  Notify --> Result{Commit succeeds?}
  Result -- No --> Denied
  Result -- Yes --> Done
  Denied --> Finish([END])
  Done --> Finish
```

The current customer profile UI's Cancel button opens a modal offering Keep Reservation or Contact Staff, then navigates to `/contact` with a subject; it does not invoke the hook's `handleCancelReservation` (`src/app/profile/page.tsx`, `src/app/profile/components/reservations-list.tsx`, `src/app/profile/hooks/use-reservations.ts`). Staff status changes call the token-verified action through `src/app/admin/hooks/use-orders.ts`. Archive, restore and permanent delete are separate Firestore operations and confirmation choices in `src/app/admin/components/reservations-tab.tsx`.
