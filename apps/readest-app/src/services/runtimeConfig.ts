import {
  getCustomServerRuntimeConfig,
  type PublicReadestClientConfig,
  type ReadestDeploymentMode,
  type ReadestRuntimeCapabilities,
} from './customServerConfig';

export type ReadestRuntimeConfig = PublicReadestClientConfig;

export const DEFAULT_RUNTIME_CAPABILITIES: ReadestRuntimeCapabilities = {
  billingEnabled: true,
  emailInEnabled: true,
  emailInRequiresPremium: true,
  cloudSyncRequiresPremium: true,
  ttsCacheRequiresPremium: true,
};

declare global {
  interface Window {
    __READEST_RUNTIME_CONFIG?: ReadestRuntimeConfig;
  }
}

const shouldUseCustomServerConfig = () => process.env['NEXT_PUBLIC_APP_PLATFORM'] === 'tauri';

const readBooleanEnv = (name: string, fallback: boolean): boolean => {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new Error(`${name} must be true or false.`);
};

const readDeploymentMode = (): ReadestDeploymentMode => {
  const value = process.env['READEST_DEPLOYMENT_MODE'] ?? 'hosted';
  if (value !== 'hosted' && value !== 'self-hosted') {
    throw new Error('READEST_DEPLOYMENT_MODE must be hosted or self-hosted.');
  }
  return value;
};

const getServerCapabilities = (): ReadestRuntimeCapabilities => ({
  billingEnabled: readBooleanEnv('READEST_BILLING_ENABLED', true),
  emailInEnabled: readBooleanEnv('READEST_EMAIL_IN_ENABLED', true),
  emailInRequiresPremium: readBooleanEnv('READEST_EMAIL_IN_REQUIRES_PREMIUM', true),
  cloudSyncRequiresPremium: readBooleanEnv('READEST_CLOUD_SYNC_REQUIRES_PREMIUM', true),
  ttsCacheRequiresPremium: readBooleanEnv('READEST_TTS_CACHE_REQUIRES_PREMIUM', true),
});

export const getRuntimeConfig = (): ReadestRuntimeConfig | undefined => {
  if (typeof window === 'undefined') return undefined;
  if (shouldUseCustomServerConfig()) {
    const customConfig = getCustomServerRuntimeConfig();
    if (customConfig) return { ...window.__READEST_RUNTIME_CONFIG, ...customConfig };
  }
  return window.__READEST_RUNTIME_CONFIG;
};

export const getServerRuntimeConfig = (): ReadestRuntimeConfig => ({
  // Browser runtime config should prefer a public Supabase URL when provided.
  // SUPABASE_URL remains as a backward-compatible fallback for non-split setups.
  supabaseUrl:
    process.env['SUPABASE_PUBLIC_URL'] ??
    process.env['NEXT_PUBLIC_SUPABASE_URL'] ??
    process.env['SUPABASE_URL'],
  supabaseAnonKey: process.env['SUPABASE_ANON_KEY'] ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
  apiBaseUrl:
    process.env['API_BASE_URL'] ??
    process.env['NEXT_PUBLIC_API_BASE_URL'] ??
    process.env['SITE_URL'],
  // These were previously baked as NEXT_PUBLIC_* build args; now read from runtime env so
  // the published image can be configured without rebuilding.
  objectStorageType:
    process.env['OBJECT_STORAGE_TYPE'] ?? process.env['NEXT_PUBLIC_OBJECT_STORAGE_TYPE'],
  storageFixedQuota: (() => {
    const raw =
      process.env['STORAGE_FIXED_QUOTA'] ?? process.env['NEXT_PUBLIC_STORAGE_FIXED_QUOTA'];
    return raw ? parseInt(raw, 10) : undefined;
  })(),
  translationFixedQuota: (() => {
    const raw =
      process.env['TRANSLATION_FIXED_QUOTA'] ?? process.env['NEXT_PUBLIC_TRANSLATION_FIXED_QUOTA'];
    return raw ? parseInt(raw, 10) : undefined;
  })(),
  deploymentMode: readDeploymentMode(),
  capabilities: getServerCapabilities(),
});

export const getRuntimeCapabilities = (): ReadestRuntimeCapabilities => {
  if (typeof window === 'undefined') return getServerCapabilities();
  return getRuntimeConfig()?.capabilities ?? DEFAULT_RUNTIME_CAPABILITIES;
};

export const getDeploymentMode = (): ReadestDeploymentMode => {
  if (typeof window === 'undefined') return readDeploymentMode();
  return getRuntimeConfig()?.deploymentMode ?? 'hosted';
};
