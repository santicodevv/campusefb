export const STORAGE_KEYS = {
  SESSION_EXPIRED: 'moddle_session_expired',
  LAST_ACTIVITY: 'moddle_last_activity',
  ACCESS_TOKEN: 'moddle_access_token',
  SESSION_CHANNEL: 'moddle_session',
} as const;

export const SESSION = {
  INACTIVITY_LIMIT: 25 * 60 * 1000,
  GRACE_LIMIT: 5 * 60,
} as const;
