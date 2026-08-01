import { beforeEach, describe, expect, test, vi } from 'vitest';

const capabilities = vi.hoisted(() => ({
  billingEnabled: true,
  emailInEnabled: true,
  emailInRequiresPremium: true,
  cloudSyncRequiresPremium: true,
  ttsCacheRequiresPremium: true,
}));

vi.mock('@/services/runtimeConfig', () => ({
  getRuntimeCapabilities: () => capabilities,
  getRuntimeConfig: () => undefined,
}));

import { isCloudSyncAllowed, isEmailInAllowed, isTTSCacheAllowed } from '@/utils/access';

describe('runtime capability gates', () => {
  beforeEach(() => {
    Object.assign(capabilities, {
      billingEnabled: true,
      emailInEnabled: true,
      emailInRequiresPremium: true,
      cloudSyncRequiresPremium: true,
      ttsCacheRequiresPremium: true,
    });
  });

  test('preserves hosted premium gates', () => {
    expect(isEmailInAllowed('free')).toBe(false);
    expect(isCloudSyncAllowed('free')).toBe(false);
    expect(isTTSCacheAllowed('free')).toBe(false);
  });

  test('can remove premium gates independently for self-hosted services', () => {
    capabilities.emailInRequiresPremium = false;
    capabilities.cloudSyncRequiresPremium = false;
    capabilities.ttsCacheRequiresPremium = false;

    expect(isEmailInAllowed('free')).toBe(true);
    expect(isCloudSyncAllowed('free')).toBe(true);
    expect(isTTSCacheAllowed('free')).toBe(true);
  });

  test('keeps email ingestion unavailable when the server disables it', () => {
    capabilities.emailInEnabled = false;
    capabilities.emailInRequiresPremium = false;
    expect(isEmailInAllowed('pro')).toBe(false);
  });
});
