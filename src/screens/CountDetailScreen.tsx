import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { StaticScreenProps } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { API_BASE } from '../api/client';
import type { PhysicalCountDetail, Reconciliation } from '../api/types';
import { isApiError, useSession } from '../auth/session';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { font, radii } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

type Props = StaticScreenProps<{ id: number; name: string }>;

export function CountDetailScreen({ route }: Props) {
  const { colors } = useTheme();
  const { api, canWrite, accessToken, deny } = useSession();
  const navigation = useNavigation();
  const [detail, setDetail] = useState<PhysicalCountDetail | null>(null);
  const [summary, setSummary] = useState<Reconciliation | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(true);
  const closed = detail?.status === 'COMPLETED';
  const writable = canWrite && !closed;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [count, recon] = await Promise.all([
        api.physicalCount(route.params.id),
        api.reconciliation(route.params.id).catch(() => null),
      ]);
      setDetail(count.physicalCount);
      setSummary(recon?.reconciliation ?? null);
      const next: Record<number, string> = {};
      count.physicalCount.items.forEach(item => {
        next[item.id] = item.notes ?? '';
      });
      setNotes(next);
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
  }, [api, deny, route.params.id]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  async function saveItem(itemId: number, found: boolean) {
    try {
      await api.markItem(route.params.id, itemId, {
        found,
        notes: notes[itemId] ?? '',
      });
      await load();
    } catch (caught) {
      setError(isApiError(caught) ? caught.message : 'No hay conexión.');
    }
  }

  async function closeCount() {
    try {
      await api.completeCount(route.params.id);
      await load();
    } catch (caught) {
      setError(isApiError(caught) ? caught.message : 'No hay conexión.');
    }
  }

  async function addPhoto(itemId: number, fromCamera: boolean) {
    const result = fromCamera
      ? await launchCamera({ mediaType: 'photo', quality: 0.8 })
      : await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    const asset = result.assets?.[0];
    if (!asset?.uri) {
      return;
    }
    const form = new FormData();
    form.append('file', {
      uri: asset.uri,
      name: asset.fileName ?? 'foto.jpg',
      type: asset.type ?? 'image/jpeg',
    } as unknown as Blob);
    try {
      await api.uploadPhoto(route.params.id, itemId, form);
      await load();
    } catch (caught) {
      setError(isApiError(caught) ? caught.message : 'No hay conexión.');
    }
  }

  if (loading && !detail) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <LoadingState />
      </View>
    );
  }
  if (error && !detail) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ErrorState message={error} onRetry={canRetry ? load : undefined} />
      </View>
    );
  }
  if (!detail) {
    return null;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.onSurface }]}>{detail.name}</Text>
      <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>
        {closed ? 'Completado' : 'En curso'}
        {summary
          ? ` · ${summary.found ?? 0} encontrados · ${summary.missing ?? 0} faltantes`
          : ''}
      </Text>
      {error ? (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      ) : null}
      {writable ? (
        <Pressable
          onPress={() =>
            navigation.dispatch(
              CommonActions.navigate({
                name: 'Scanner',
                params: { countId: detail.id },
              }),
            )
          }
          style={[styles.button, { backgroundColor: colors.brand }]}>
          <Text style={[styles.buttonText, { color: colors.onBrand }]}>Escanear</Text>
        </Pressable>
      ) : null}
      {detail.items.map(item => (
        <View
          key={item.id}
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceLowest,
              borderColor: colors.outlineVariant,
            },
          ]}>
          <Text style={[styles.code, { color: colors.onSurface }]}>
            {item.asset.assetCode}
          </Text>
          <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>
            {item.asset.brand} {item.asset.model}
          </Text>
          <View
            style={[
              styles.chip,
              {
                backgroundColor: item.found
                  ? colors.primaryContainer
                  : colors.errorContainer,
              },
            ]}>
            <Text
              style={[
                styles.chipText,
                {
                  color: item.found
                    ? colors.onPrimaryContainer
                    : colors.onErrorContainer,
                },
              ]}>
              {item.found ? 'Encontrado' : 'Faltante'}
            </Text>
          </View>
          {writable ? (
            <View style={styles.switchRow}>
              <Text style={[styles.meta, { color: colors.onSurface }]}>Encontrado</Text>
              <Switch
                onValueChange={value => {
                  saveItem(item.id, value).catch(() => undefined);
                }}
                value={item.found}
              />
            </View>
          ) : null}
          {writable ? (
            <TextInput
              onChangeText={value =>
                setNotes(current => ({ ...current, [item.id]: value }))
              }
              placeholder="Notas"
              placeholderTextColor={colors.outline}
              style={[
                styles.input,
                {
                  color: colors.onSurface,
                  borderColor: colors.outlineVariant,
                },
              ]}
              value={notes[item.id] ?? ''}
            />
          ) : item.notes ? (
            <Text style={[styles.meta, { color: colors.onSurface }]}>{item.notes}</Text>
          ) : null}
          {writable ? (
            <Pressable onPress={() => saveItem(item.id, item.found).catch(() => undefined)}>
              <Text style={[styles.link, { color: colors.brand }]}>Guardar nota</Text>
            </Pressable>
          ) : null}
          <View style={styles.photos}>
            {item.photos.map(photo => (
              <View key={photo.id}>
                <Image
                  source={{
                    uri: `${API_BASE}/physical-counts/${detail.id}/items/${item.id}/photos/${photo.id}`,
                    headers: accessToken
                      ? { Authorization: `Bearer ${accessToken}` }
                      : undefined,
                  }}
                  style={styles.photo}
                />
                {writable ? (
                  <Pressable
                    onPress={() => {
                      api
                        .deletePhoto(detail.id, item.id, photo.id)
                        .then(load)
                        .catch(caught =>
                          setError(
                            isApiError(caught) ? caught.message : 'No hay conexión.',
                          ),
                        );
                    }}>
                    <Text style={[styles.delete, { color: colors.error }]}>Borrar</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
          {writable ? (
            <View style={styles.switchRow}>
              <Pressable onPress={() => addPhoto(item.id, true).catch(() => undefined)}>
                <Text style={[styles.link, { color: colors.brand }]}>Tomar foto</Text>
              </Pressable>
              <Pressable onPress={() => addPhoto(item.id, false).catch(() => undefined)}>
                <Text style={[styles.link, { color: colors.brand }]}>Galería</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ))}
      {writable ? (
        <Pressable
          onPress={() =>
            Alert.alert(
              'Cerrar conteo',
              'Un conteo cerrado ya no acepta marcas, fotos ni escaneos.',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Cerrar', style: 'destructive', onPress: () => closeCount() },
              ],
            )
          }
          style={[styles.button, { backgroundColor: colors.error }]}>
          <Text style={[styles.buttonText, { color: colors.onErrorContainer }]}>
            Cerrar conteo
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { gap: 12, padding: 16, paddingBottom: 32 },
  title: { fontFamily: font.semibold, fontSize: 24 },
  meta: { fontFamily: font.regular, fontSize: 14 },
  error: { fontFamily: font.regular, fontSize: 14 },
  code: { fontFamily: font.semibold, fontSize: 16 },
  card: {
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: radii.card,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { fontFamily: font.medium, fontSize: 12 },
  link: { fontFamily: font.semibold, fontSize: 14 },
  delete: { fontFamily: font.medium, fontSize: 12 },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    borderRadius: radii.control,
    borderWidth: 1,
    fontFamily: font.regular,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photo: { borderRadius: 12, height: 72, width: 72 },
  button: {
    alignItems: 'center',
    borderRadius: radii.control,
    paddingVertical: 14,
  },
  buttonText: { fontFamily: font.semibold, fontSize: 14 },
});
