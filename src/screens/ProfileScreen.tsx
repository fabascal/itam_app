import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { User } from 'lucide-react-native';
import { isApiError, useSession } from '../auth/session';
import { ErrorState } from '../components/ErrorState';
import { font, radii } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

export function ProfileScreen() {
  const { colors } = useTheme();
  const { user, refreshMe } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    setBusy(true);
    setError(null);
    try {
      await refreshMe();
    } catch (caught) {
      setError(isApiError(caught) ? caught.message : 'No hay conexión.');
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ErrorState message={error} onRetry={reload} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.surfaceLowest, borderColor: colors.outlineVariant }]}>
        <User color={colors.brand} size={28} strokeWidth={2} />
        <Text style={[styles.name, { color: colors.onSurface }]}>
          {user?.fullName ?? 'Cargando...'}
        </Text>
        <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>
          {user?.email ?? ''}
        </Text>
        <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>
          {user?.role.name ?? ''}
        </Text>
      </View>
      <Pressable onPress={reload} style={[styles.button, { backgroundColor: colors.brand }]}>
        <Text style={[styles.buttonText, { color: colors.onBrand }]}>
          {busy ? 'Cargando...' : 'Actualizar'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 16 },
  card: {
    alignItems: 'flex-start',
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  name: {
    fontFamily: font.semibold,
    fontSize: 24,
    marginTop: 8,
  },
  meta: {
    fontFamily: font.regular,
    fontSize: 14,
  },
  button: {
    alignItems: 'center',
    borderRadius: radii.control,
    paddingVertical: 12,
  },
  buttonText: {
    fontFamily: font.semibold,
    fontSize: 14,
  },
});
