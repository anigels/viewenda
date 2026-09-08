import { expect, it } from 'vitest';
import { readableTime } from './planning';

it('formats local planned times using the locale hour cycle without shifting the hour', () => {
  expect(readableTime('21:00', 'en-US')).toBe('9:00 PM');
  expect(readableTime('21:00', 'en-GB')).toBe('21:00');
  expect(readableTime('00:05', 'en-US')).toBe('12:05 AM');
  expect(readableTime('12:00', 'en-US')).toBe('12:00 PM');
});
