import { formatDate } from './date';

test('formatea ISO UTC como dd/mm/aaaa', () => {
  expect(formatDate('2024-03-01T00:00:00.000Z')).toBe('01/03/2024');
});

test('devuelve null si no hay fecha', () => {
  expect(formatDate(null)).toBeNull();
  expect(formatDate(undefined)).toBeNull();
  expect(formatDate('no-es-fecha')).toBeNull();
});
