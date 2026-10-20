import { parseAssetQr } from './qr';

test('lee un QR de activo', () => {
  expect(
    parseAssetQr('{"t":"asset","v":1,"id":123,"c":"LAP-0001"}'),
  ).toEqual({ id: 123, code: 'LAP-0001' });
});

test('rechaza texto que no es el JSON del activo', () => {
  expect(parseAssetQr('LAP-0001')).toBeNull();
  expect(parseAssetQr('{"t":"user","v":1,"id":1,"c":"X"}')).toBeNull();
  expect(parseAssetQr('{"t":"asset","v":2,"id":1,"c":"X"}')).toBeNull();
  expect(parseAssetQr('{"t":"asset","v":1,"id":"1","c":"X"}')).toBeNull();
  expect(parseAssetQr('{"t":"asset","v":1,"id":1}')).toBeNull();
});
