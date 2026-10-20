import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { Location } from '../api/types';
import { isApiError, useSession } from '../auth/session';
import { font, radii } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

export function CountCreateScreen() {
  const { colors } = useTheme();
  const { api } = useSession();
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .locations()
      .then(result => setLocations(result.locations))
      .catch(() => undefined);
  }, [api]);

  async function submit() {
    if (!name.trim()) {
      setError('Datos inválidos');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await api.createCount({
        name: name.trim(),
        ...(locationId === null ? {} : { locationId }),
      });
      navigation.dispatch(
        CommonActions.navigate({
          name: 'CountDetail',
          params: {
            id: result.physicalCount.id,
            name: result.physicalCount.name,
          },
        }),
      );
    } catch (caught) {
      setError(isApiError(caught) ? caught.message : 'No hay conexión.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Nombre</Text>
      <TextInput
        onChangeText={setName}
        placeholder="Conteo de octubre"
        placeholderTextColor={colors.outline}
        style={[
          styles.input,
          {
            color: colors.onSurface,
            borderColor: colors.outlineVariant,
            backgroundColor: colors.surfaceLowest,
          },
        ]}
        value={name}
      />
      <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
        Ubicación
      </Text>
      <Pressable
        onPress={() => setLocationId(null)}
        style={[
          styles.choice,
          {
            borderColor: locationId === null ? colors.brand : colors.outlineVariant,
            backgroundColor: colors.surfaceLowest,
          },
        ]}>
        <Text style={[styles.choiceText, { color: colors.onSurface }]}>
          Sin ubicación
        </Text>
      </Pressable>
      {locations.map(location => (
        <Pressable
          key={location.id}
          onPress={() => setLocationId(location.id)}
          style={[
            styles.choice,
            {
              borderColor:
                locationId === location.id ? colors.brand : colors.outlineVariant,
              backgroundColor: colors.surfaceLowest,
            },
          ]}>
          <Text style={[styles.choiceName, { color: colors.onSurface }]}>
            {location.name}
          </Text>
          <Text style={[styles.choicePath, { color: colors.onSurfaceVariant }]}>
            {location.path}
          </Text>
        </Pressable>
      ))}
      {error ? (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      ) : null}
      <Pressable
        disabled={busy}
        onPress={submit}
        style={[styles.button, { backgroundColor: colors.brand }]}>
        <Text style={[styles.buttonText, { color: colors.onBrand }]}>
          {busy ? 'Cargando...' : 'Crear conteo'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { gap: 8, padding: 16, paddingBottom: 32 },
  label: { fontFamily: font.medium, fontSize: 12, marginTop: 8 },
  input: {
    borderRadius: radii.control,
    borderWidth: 1,
    fontFamily: font.regular,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  choice: {
    borderRadius: radii.control,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  choiceText: { fontFamily: font.regular, fontSize: 14 },
  choiceName: { fontFamily: font.medium, fontSize: 14 },
  choicePath: { fontFamily: font.medium, fontSize: 12 },
  error: { fontFamily: font.regular, fontSize: 14 },
  button: {
    alignItems: 'center',
    borderRadius: radii.control,
    marginTop: 12,
    paddingVertical: 14,
  },
  buttonText: { fontFamily: font.semibold, fontSize: 14 },
});
