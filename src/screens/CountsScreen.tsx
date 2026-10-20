import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { ClipboardCheck } from 'lucide-react-native';
import type { PhysicalCount } from '../api/types';
import { isApiError, useSession } from '../auth/session';
import { Card } from '../components/Card';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { font, radii } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

export function CountsScreen() {
  const { colors } = useTheme();
  const { api, canWrite, deny } = useSession();
  const navigation = useNavigation();
  const [counts, setCounts] = useState<PhysicalCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.physicalCounts();
      setCounts(result.physicalCounts);
    } catch (caught) {
      if (isApiError(caught) && caught.status === 403) {
        deny();
        return;
      }
      if (isApiError(caught) && caught.status === 401) {
        return;
      }
      const status = isApiError(caught) ? caught.status : 0;
      setCanRetry(status === 0 || status === 429 || status >= 500);
      setError(isApiError(caught) ? caught.message : 'No hay conexión.');
    } finally {
      setLoading(false);
    }
  }, [api, deny]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <LoadingState />
      </View>
    );
  }
  if (error) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ErrorState message={error} onRetry={canRetry ? load : undefined} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        contentContainerStyle={styles.list}
        contentInsetAdjustmentBehavior="automatic"
        data={counts}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.onSurfaceVariant }]}>
            Sin conteos
          </Text>
        }
        renderItem={({ item }) => (
          <Card
            onPress={() =>
              navigation.dispatch(
                CommonActions.navigate({
                  name: 'CountDetail',
                  params: { id: item.id, name: item.name },
                }),
              )
            }>
            <View style={styles.row}>
              <ClipboardCheck color={colors.brand} size={20} strokeWidth={2} />
              <Text style={[styles.name, { color: colors.onSurface }]}>{item.name}</Text>
            </View>
            <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>
              {item.status === 'COMPLETED' ? 'Completado' : 'En curso'}
              {item.location?.name ? ` · ${item.location.name}` : ''}
            </Text>
          </Card>
        )}
      />
      {canWrite ? (
        <Pressable
          onPress={() =>
            navigation.dispatch(CommonActions.navigate({ name: 'CountCreate' }))
          }
          style={[styles.button, { backgroundColor: colors.brand }]}>
          <Text style={[styles.buttonText, { color: colors.onBrand }]}>
            Nuevo conteo
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { gap: 12, padding: 16 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  name: { fontFamily: font.semibold, fontSize: 16 },
  meta: { fontFamily: font.medium, fontSize: 12, marginTop: 6 },
  empty: { fontFamily: font.regular, fontSize: 14, textAlign: 'center' },
  button: {
    borderRadius: radii.control,
    margin: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { fontFamily: font.semibold, fontSize: 14 },
});
