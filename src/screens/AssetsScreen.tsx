import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StaticScreenProps } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Monitor, QrCode, User } from 'lucide-react-native';
import type { AssetSummary } from '../api/types';
import { isApiError, useSession } from '../auth/session';
import { Card } from '../components/Card';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { StatusChip } from '../components/StatusChip';
import type { MainParamList } from '../navigation/types';
import { font } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

type Props = StaticScreenProps<{ locationId: number; name: string }>;

export function AssetsScreen({ route }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { api, deny } = useSession();
  const navigation = useNavigation<NativeStackNavigationProp<MainParamList>>();
  const [assets, setAssets] = useState<AssetSummary[]>([]);
  const [includeChildren, setIncludeChildren] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [canRetry, setCanRetry] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const result = await api.assets(route.params.locationId, includeChildren);
      setAssets(result.assets);
    } catch (caught) {
      if (isApiError(caught) && caught.status === 403) {
        deny();
        return;
      }
      if (isApiError(caught) && caught.status === 401) {
        return;
      }
      const status = isApiError(caught) ? caught.status : 0;
      setNotFound(status === 404);
      setCanRetry(status === 0 || status === 429 || status >= 500);
      setError(isApiError(caught) ? caught.message : 'No hay conexión.');
    } finally {
      setLoading(false);
    }
  }, [api, deny, includeChildren, route.params.locationId]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: route.params.name });
  }, [navigation, route.params.name]);

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
        <ErrorState
          message={error}
          onBack={notFound ? () => navigation.goBack() : undefined}
          onRetry={canRetry ? load : undefined}
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.switchRow, { backgroundColor: colors.surfaceLow }]}>
        <Text style={[styles.switchLabel, { color: colors.onSurface }]}>
          Incluir sububicaciones
        </Text>
        <Switch
          onValueChange={setIncludeChildren}
          thumbColor={colors.surfaceLowest}
          trackColor={{ false: colors.outlineVariant, true: colors.primary }}
          value={includeChildren}
        />
      </View>
      <FlatList
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 88 },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        data={assets}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.onSurfaceVariant }]}>
            Sin activos en esta ubicación
          </Text>
        }
        renderItem={({ item }) => (
          <Card
            onPress={() =>
              navigation.navigate('AssetDetail', { id: item.id })
            }>
            <Text style={[styles.code, { color: colors.onSurface }]}>
              {item.assetCode}
            </Text>
            <View style={styles.line}>
              <Monitor color={colors.onSurfaceVariant} size={16} strokeWidth={2} />
              <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>
                {item.brand} {item.model}
              </Text>
            </View>
            {item.assignedToName ? (
              <View style={styles.line}>
                <User color={colors.onSurfaceVariant} size={16} strokeWidth={2} />
                <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>
                  {item.assignedToName}
                </Text>
              </View>
            ) : null}
            <StatusChip status={item.status} />
          </Card>
        )}
      />
      <Pressable
        accessibilityLabel="Escanear"
        onPress={() => navigation.navigate('Scanner')}
        style={[
          styles.fab,
          {
            backgroundColor: colors.brand,
            bottom: insets.bottom + 16,
          },
        ]}>
        <QrCode color={colors.onBrand} size={24} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: {
    gap: 12,
    padding: 16,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  switchLabel: {
    fontFamily: font.medium,
    fontSize: 14,
  },
  code: {
    fontFamily: font.semibold,
    fontSize: 16,
  },
  line: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  meta: {
    fontFamily: font.regular,
    fontSize: 14,
  },
  empty: {
    fontFamily: font.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  fab: {
    alignItems: 'center',
    borderRadius: 28,
    elevation: 2,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    width: 56,
  },
});
