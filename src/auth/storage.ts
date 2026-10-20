import * as Keychain from 'react-native-keychain';
import type { User } from '../api/types';

const SERVICE = 'com.itam.app.session';

export type StoredSession = {
  accessToken: string;
  refreshToken: string;
  user: User;
  permissions: string[];
};

export async function readSession(): Promise<StoredSession | null> {
  const result = await Keychain.getGenericPassword({ service: SERVICE });
  if (!result) {
    return null;
  }
  return JSON.parse(result.password) as StoredSession;
}

export async function writeSession(session: StoredSession): Promise<void> {
  await Keychain.setGenericPassword('session', JSON.stringify(session), {
    service: SERVICE,
  });
}

export async function clearSession(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}
