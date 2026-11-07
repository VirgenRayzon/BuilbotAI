import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PUBLIC_FEATURE_SIGN_IN_REASON,
  PUBLIC_FEATURE_SIGN_IN_URL,
  getCustomerSignInDestination,
} from './public-feature-auth';

test('public feature sign-in uses one reason and never resumes an originating page', () => {
  assert.equal(PUBLIC_FEATURE_SIGN_IN_REASON, 'feature_required');
  assert.equal(PUBLIC_FEATURE_SIGN_IN_URL, '/signin?reason=feature_required');
  assert.equal(
    getCustomerSignInDestination('feature_required', '/parts/PRD-123456'),
    '/builder'
  );
});

test('other sign-in reasons preserve safe product returns and reject unsafe ones', () => {
  assert.equal(
    getCustomerSignInDestination('idle_timeout', '/pre-builts/PRD-123456'),
    '/pre-builts/PRD-123456'
  );
  assert.equal(getCustomerSignInDestination(null, 'https://example.com'), '/builder');
});
