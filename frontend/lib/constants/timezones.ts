/**
 * US timezones only (IANA). Used for location and clinic setup.
 * All appointments/meets are online; timezone defines when slots are shown.
 */
export const US_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Phoenix', label: 'Arizona (no DST)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Anchorage', label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HT)' },
] as const;

export const US_TIMEZONE_VALUES = US_TIMEZONES.map((t) => t.value);

export const DEFAULT_US_TIMEZONE = 'America/New_York';
