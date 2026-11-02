# Customer Order Activity Payment Gate Design

## Intent

Prevent unpaid online-payment attempts from presenting fulfillment activity as though checkout succeeded.

## Approved behavior

- Show a provider-neutral yellow recovery banner for incomplete online payments.
- Use “Payment Not Completed” and a right-aligned “Retry” button without naming GCash.
- Show customer Order Activity only when the order is paid or uses Cash on Delivery.
- Use the same recovery treatment for GCash and PayMongo.
- Continue showing the order and its item groups when activity is hidden.

## Approach

Use pure customer-workflow predicates as the visibility rules, then consume them in the customer reservations list. This keeps payment semantics out of the JSX and makes paid, COD, and incomplete online-payment cases independently testable.

