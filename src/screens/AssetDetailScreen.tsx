import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StaticScreenProps } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Calendar, MapPin, User } from 'lucide-react-native';
import type { Asset } from '../api/types';
import { isApiError, useSession } from '../auth/session';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { StatusChip } from '../components/StatusChip';
import type { MainParamList } from '../navigation/types';
import { DocumentsPane, TicketsPane } from './AssetExtra';
import { font, radii } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { formatDate } from '../utils/date';

type Props = StaticScreenProps<{ id: number; code?: string }>;

function storageLabel(asset: Asset): string | null {
  const size = asset.storageGb === null ? null : `${asset.storageGb} GB`;
  const kind = asset.storageType;
  if (!size && !kind) {
    return null;
  }
  return [size, kind].filter(Boolean).join(' ');
}

export function AssetDetailScreen({ route }: Props) {
  const { colors } = useTheme();
  const { api, deny } = useSession();
  const navigation = useNavigation<NativeStackNavigationProp<MainParamList>>();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [canRetry, setCanRetry] = useState(true);
  const [tab, setTab] = useState<'general' | 'tickets' | 'documents'>('general');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const result = await api.asset(route.params.id);
      setAsset(result.asset);
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
  }, [api, deny, route.params.id]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        {route.params.code ? (
          <Text style={[styles.code, styles.pending, { color: colors.onSurface }]}>
            {route.params.code}
          </Text>
        ) : null}
        <LoadingState />
      </View>
    );
  }
  if (error || !asset) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ErrorState
          message={error ?? 'Activo no encontrado'}
          onBack={notFound ? () => navigation.goBack() : undefined}
          onRetry={canRetry ? load : undefined}
        />
      </View>
    );
  }

  const assignedDate = formatDate(asset.assignedToDate);
  const storage = storageLabel(asset);
  const showHardware = asset.processor || asset.ramGb !== null || storage;
  const showAssignee = asset.assignedToName || assignedDate;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.tabs}>
        {(
          [
            ['general', 'General'],
            ['tickets', 'Tickets'],
            ['documents', 'Documentos'],
          ] as const
        ).map(([key, label]) => {
          const selected = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={[
                styles.tab,
                {
                  backgroundColor: selected ? colors.brand : colors.surfaceLow,
                },
              ]}>
              <Text
                style={[
                  styles.tabLabel,
                  { color: selected ? colors.onBrand : colors.onSurface },
                ]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {tab === 'tickets' ? <TicketsPane assetId={asset.id} /> : null}
      {tab === 'documents' ? <DocumentsPane assetId={asset.id} /> : null}
      {tab === 'general' ? (
        <>
      <Text style={[styles.section, { color: colors.onSurface }]}>General</Text>
      <Text style={[styles.code, { color: colors.onSurface }]}>{asset.assetCode}</Text>
      {asset.assetType ? (
        <Field label="Tipo" value={asset.assetType} />
      ) : null}
      <StatusChip status={asset.status} />
      {asset.description ? (
        <Field label="Descripción" value={asset.description} />
      ) : null}

      {showHardware ? (
        <Text style={[styles.section, { color: colors.onSurface }]}>Hardware</Text>
      ) : null}
      {asset.processor ? (
        <Field label="Procesador" value={asset.processor} />
      ) : null}
      {asset.ramGb !== null ? (
        <Field label="RAM" value={`${asset.ramGb} GB`} />
      ) : null}
      {storage ? <Field label="Almacenamiento" value={storage} /> : null}

      {showAssignee ? (
        <Text style={[styles.section, { color: colors.onSurface }]}>
          Responsable
        </Text>
      ) : null}
      {asset.assignedToName ? (
        <View style={styles.line}>
          <User color={colors.onSurfaceVariant} size={16} strokeWidth={2} />
          <Field label="Responsable" value={asset.assignedToName} />
        </View>
      ) : null}
      {assignedDate ? (
        <View style={styles.line}>
          <Calendar color={colors.onSurfaceVariant} size={16} strokeWidth={2} />
          <Field label="Fecha" value={assignedDate} />
        </View>
      ) : null}

      {asset.location ? (
        <>
          <Text style={[styles.section, { color: colors.onSurface }]}>
            Ubicación
          </Text>
          <View style={styles.line}>
            <MapPin color={colors.onSurfaceVariant} size={16} strokeWidth={2} />
            <Field label="Ubicación" value={asset.location.path} />
          </View>
        </>
      ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>
        {label}
      </Text>
      <Text style={[styles.fieldValue, { color: colors.onSurface }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { gap: 8, padding: 16, paddingBottom: 32 },
  pending: { paddingHorizontal: 16, paddingTop: 16 },
  section: {
    fontFamily: font.semibold,
    fontSize: 16,
    marginTop: 12,
  },
  code: {
    fontFamily: font.semibold,
    fontSize: 16,
  },
  fieldLabel: {
    fontFamily: font.medium,
    fontSize: 12,
  },
  fieldValue: {
    fontFamily: font.regular,
    fontSize: 14,
  },
  line: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    borderRadius: radii.control,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabLabel: {
    fontFamily: font.semibold,
    fontSize: 12,
  },
});
