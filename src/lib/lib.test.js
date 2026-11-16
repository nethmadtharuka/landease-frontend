import { describe, expect, it } from 'vitest';
import { normalizeBaseUrl } from '../api/baseUrl';
import { bookingActions, canReview } from './bookingActions';
import { escapeHtml } from './html';
import { apiErrorMessage } from './apiError';
import { SERVICE_CATEGORIES, categoryLabel, SELF_REGISTRABLE_ROLES } from './enums';

describe('normalizeBaseUrl (audit F6: /api/api duplication)', () => {
  it.each([
    [undefined, ''],
    ['', ''],
    ['   ', ''],
    ['https://api.example.com', 'https://api.example.com'],
    ['https://api.example.com/', 'https://api.example.com'],
    ['https://api.example.com/api', 'https://api.example.com'],   // the value the old README documented
    ['https://api.example.com/api/', 'https://api.example.com'],
    ['https://api.example.com/API', 'https://api.example.com'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizeBaseUrl(input)).toBe(expected);
  });

  it('never yields a double /api prefix for endpoint paths', () => {
    for (const v of ['', '/api', 'https://x.test/api/']) {
      expect(`${normalizeBaseUrl(v)}/api/Auth/login`).not.toMatch(/\/api\/api\//);
    }
  });
});

describe('bookingActions (mirrors BookingService.AllowedTransitions)', () => {
  const statuses = (b, isProvider) => bookingActions(b, { isProvider }).map(a => a.status);

  it('provider accepts or declines a request', () => {
    expect(statuses({ status: 'Requested' }, true)).toEqual(['Accepted', 'Cancelled']);
  });

  it('migrant can only cancel', () => {
    for (const s of ['Requested', 'Accepted', 'InProgress']) {
      expect(statuses({ status: s }, false)).toEqual(['Cancelled']);
    }
  });

  it('provider moves work forward one step at a time', () => {
    expect(statuses({ status: 'Accepted' }, true)).toEqual(['InProgress', 'Cancelled']);
    expect(statuses({ status: 'InProgress' }, true)).toEqual(['Completed', 'Cancelled']);
  });

  it('terminal states offer no actions (audit F8)', () => {
    for (const s of ['Completed', 'Cancelled']) {
      expect(statuses({ status: s }, true)).toEqual([]);
      expect(statuses({ status: s }, false)).toEqual([]);
    }
  });

  it('only the migrant reviews a completed, unreviewed booking', () => {
    expect(canReview({ status: 'Completed', hasReview: false }, { isProvider: false })).toBe(true);
    expect(canReview({ status: 'Completed', hasReview: true }, { isProvider: false })).toBe(false);
    expect(canReview({ status: 'Completed', hasReview: false }, { isProvider: true })).toBe(false);
    expect(canReview({ status: 'InProgress', hasReview: false }, { isProvider: false })).toBe(false);
  });
});

describe('escapeHtml (audit F4: SOS popup XSS)', () => {
  it('neutralises markup and attribute breakouts', () => {
    const out = escapeHtml('<img src=x onerror="alert(1)">\'&');
    expect(out).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&#39;&amp;');
    expect(out).not.toMatch(/[<>"']/);
  });

  it('handles null and numbers', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(42)).toBe('42');
  });
});

describe('apiErrorMessage', () => {
  it('uses the API envelope message', () => {
    expect(apiErrorMessage({ response: { status: 409, data: { message: 'Already booked.' } } })).toBe('Already booked.');
  });

  it('joins multiple validation errors', () => {
    const err = { response: { status: 400, data: { message: 'A', errors: ['A', 'B'] } } };
    expect(apiErrorMessage(err)).toBe('A B');
  });

  it('explains network failures and rate limits', () => {
    expect(apiErrorMessage({})).toMatch(/connection/);
    expect(apiErrorMessage({ response: { status: 429, data: {} } })).toMatch(/Too many requests/);
  });

  it('falls back to the caller message', () => {
    expect(apiErrorMessage({ response: { status: 500, data: {} } }, 'Fallback')).toBe('Fallback');
  });
});

describe('enums (audit F7: contract with backend enum names)', () => {
  it('service categories match the backend ServiceCategory enum exactly', () => {
    expect(SERVICE_CATEGORIES.map(c => c.value)).toEqual(
      ['Accommodation', 'Transport', 'Legal', 'Jobs', 'Education', 'Food', 'Banking', 'CityOrientation', 'Other']);
    expect(categoryLabel('CityOrientation')).toBe('City orientation');
  });

  it('sign-up never offers privileged roles (audit F2)', () => {
    expect(SELF_REGISTRABLE_ROLES).toEqual(['Migrant', 'Helper']);
  });
});
