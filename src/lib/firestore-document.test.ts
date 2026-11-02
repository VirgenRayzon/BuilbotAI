import assert from "node:assert/strict";
import test from "node:test";
import { toFirestoreDocument } from "./firestore-document";

test("removes nested undefined fields without changing array shape", () => {
  const input = {
    items: [
      {
        id: "ssd-1",
        name: "NVMe SSD",
        prebuiltName: undefined,
      },
    ],
    shippingAddress: {
      city: "Quezon City",
      notes: undefined,
    },
  };

  assert.deepEqual(toFirestoreDocument(input), {
    items: [{ id: "ssd-1", name: "NVMe SSD" }],
    shippingAddress: { city: "Quezon City" },
  });
});

test("preserves non-plain Firestore value objects", () => {
  class FirestoreValue {
    constructor(readonly seconds: number) {}
  }

  const timestamp = new FirestoreValue(123);
  const result = toFirestoreDocument({ createdAt: timestamp });

  assert.equal(result.createdAt, timestamp);
});
