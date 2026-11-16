// Mirrors backend enums. The API serializes enums as strings (JsonStringEnumConverter), so the UI
// always sends and compares these exact names. Labels are display-only.

export const SERVICE_CATEGORIES = [
  { value: 'Accommodation', label: 'Accommodation' },
  { value: 'Transport', label: 'Transport' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Jobs', label: 'Jobs' },
  { value: 'Education', label: 'Education' },
  { value: 'Food', label: 'Food' },
  { value: 'Banking', label: 'Banking' },
  { value: 'CityOrientation', label: 'City orientation' },
  { value: 'Other', label: 'Other' },
];

export const categoryLabel = (value) =>
  SERVICE_CATEGORIES.find((c) => c.value === value)?.label ?? value;

export const MIGRATION_STATUSES = [
  { value: 'Planning', label: 'Planning' },
  { value: 'NewlyArrived', label: 'Newly arrived' },
  { value: 'Settled', label: 'Settled' },
];

export const migrationStatusLabel = (value) =>
  MIGRATION_STATUSES.find((s) => s.value === value)?.label ?? value ?? 'Unknown';

export const KYC_STATUS = { Pending: 'Pending', UnderReview: 'UnderReview', Approved: 'Approved', Rejected: 'Rejected' };

export const BOOKING_STATUS = {
  Requested: 'Requested',
  Accepted: 'Accepted',
  InProgress: 'InProgress',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
};

export const SOS_EVENT_TYPES = [
  { value: 'Medical', label: 'Medical Emergency', icon: '🏥' },
  { value: 'Safety', label: 'Safety Threat', icon: '🛡️' },
  { value: 'Legal', label: 'Legal Emergency', icon: '⚖️' },
  { value: 'Lost', label: 'Lost / Missing', icon: '🗺️' },
  { value: 'Other', label: 'Other', icon: '🆘' },
];

// Roles a user may choose at sign-up. Agency/Admin accounts are granted by LandEase staff.
export const SELF_REGISTRABLE_ROLES = ['Migrant', 'Helper'];

export const ROLE_LABEL = { Migrant: 'Migrant', Helper: 'Service provider', Agency: 'Agency staff', Admin: 'Admin' };
