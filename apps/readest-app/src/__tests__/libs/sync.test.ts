import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAPIBaseUrl: vi.fn(() => 'https://initial.example/api'),
  getAccessToken: vi.fn(),
  fetchWithTimeout: vi.fn(),
}));

vi.mock('@/services/environment', () => ({
  getAPIBaseUrl: () => mocks.getAPIBaseUrl(),
}));

vi.mock('@/utils/access', () => ({
  getAccessToken: () => mocks.getAccessToken(),
}));

vi.mock('@/utils/fetch', () => ({
  fetchWithTimeout: (...args: unknown[]) => mocks.fetchWithTimeout(...args),
}));

import { SyncClient } from '@/libs/sync';

describe('SyncClient', () => {
  beforeEach(() => {
    mocks.getAPIBaseUrl.mockReset();
    mocks.getAPIBaseUrl.mockReturnValue('https://initial.example/api');
    mocks.getAccessToken.mockReset();
    mocks.getAccessToken.mockResolvedValue('access-token');
    mocks.fetchWithTimeout.mockReset();
    mocks.fetchWithTimeout.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ books: null, configs: null, notes: null }),
    });
  });

  it('reads the current API base URL when a request starts', async () => {
    mocks.getAPIBaseUrl.mockReturnValue('https://self-hosted.example/api');

    await new SyncClient().pullChanges(0);

    expect(mocks.fetchWithTimeout).toHaveBeenCalledWith(
      expect.stringMatching(/^https:\/\/self-hosted\.example\/api\/sync\?/),
      expect.any(Object),
      15000,
    );
  });
});
