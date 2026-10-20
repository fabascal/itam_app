import { ApiError } from '../api/client';
import { runCountScan } from './countScan';

test('un scan 404 muestra el mensaje y no sigue', async () => {
  const api = {
    scanCount: async () => {
      throw new ApiError(404, 'Activo no encontrado en el conteo');
    },
  };
  await expect(runCountScan(api, 1, 123)).resolves.toEqual({
    ok: false,
    message: 'Activo no encontrado en el conteo',
  });
});
