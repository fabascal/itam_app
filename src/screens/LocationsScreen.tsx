import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MapPin } from 'lucide-react-native';
import type { Location } from '../api/types';
import { isApiError, useSession } from '../auth/session';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import type { MainParamList } from '../navigation/types';
import { font, radii } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

function HeaderLogout() {
  const { colors } = useTheme();
  const { signOut } = useSession();
  return (
    <Pressable
      onPress={() => {
        signOut().catch(() => undefined);
      }}>
      <Text style={[styles.logout, { color: colors.primary }]}>
        Cerrar sesión
      </Text>
    </Pressable>
  );
}

function renderHeaderLogout() {
  return <HeaderLogout />;
}

export function LocationsScreen() {
  const { colors } = useTheme();
  const { api, deny } = useSession();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainParamList, 'Locations'>>();
  const [locations, setLocations] = useState<Location[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.locations();
      setLocations(result.locations);
    } catch (caught) {
      if (isApiError(caught) && caught.status === 403) {
        deny();
        return;
      }
      if (isApiError(caught) && caught.status === 401) {
        return;
      }
      setRetry(isApiError(caught) ? caught.status === 0 || caught.status >= 500 || caught.status === 429 : true);
      setError(isApiError(caught) ? caught.message : 'No hay conexión.');
    } finally {
      setLoading(false);
    }
  }, [api, deny]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: renderHeaderLogout });
  }, [navigation]);

  const q = query.trim().toLowerCase();
  const visible = locations.filter(
    item =>
      item.name.toLowerCase().includes(q) || item.path.toLowerCase().includes(q),
  );

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
        <ErrorState message={error} onRetry={retry ? load : undefined} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <TextInput
        onChangeText={setQuery}
        placeholder="Buscar"
        placeholderTextColor={colors.outline}
        style={[
          styles.search,
          {
            color: colors.onSurface,
            backgroundColor: colors.surfaceLow,
            borderColor: colors.outlineVariant,
          },
        ]}
        value={query}
      />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={visible}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.onSurfaceVariant }]}>
            Sin ubicaciones
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('Assets', {
                locationId: item.id,
                name: item.name,
              })
            }
            style={[styles.row, { borderBottomColor: colors.outlineVariant }]}>
            <MapPin color={colors.onSurfaceVariant} size={20} strokeWidth={2} />
            <View style={styles.rowText}>
              <Text style={[styles.name, { color: colors.onSurface }]}>
                {item.name}
              </Text>
              <Text style={[styles.path, { color: colors.onSurfaceVariant }]}>
                {item.path}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  logout: {
    fontFamily: font.medium,
    fontSize: 14,
  },
  search: {
    borderRadius: radii.control,
    borderWidth: 1,
    fontFamily: font.regular,
    fontSize: 14,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  row: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowText: { flex: 1 },
  name: {
    fontFamily: font.semibold,
    fontSize: 16,
  },
  path: {
    fontFamily: font.medium,
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    fontFamily: font.regular,
    fontSize: 14,
    padding: 24,
    textAlign: 'center',
  },
});
