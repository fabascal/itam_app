import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { StaticScreenProps } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Camera,
  isScannedCode,
  useCameraDevice,
  useCameraPermission,
  useObjectOutput,
  type ScannedObject,
  type ScannedObjectType,
} from 'react-native-vision-camera';
import type { MainParamList } from '../navigation/types';
import { font, radii } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { isApiError, useSession } from '../auth/session';
import { runCountScan } from '../utils/countScan';
import { parseAssetQr } from '../utils/qr';

const QR_TYPES: ScannedObjectType[] = ['qr'];

type Props = StaticScreenProps<{ countId?: number } | undefined>;

export function ScannerScreen({ route }: Props) {
  const { colors } = useTheme();
  const { api } = useSession();
  const focused = useIsFocused();
  const navigation = useNavigation<NativeStackNavigationProp<MainParamList>>();
  const countId = route.params?.countId;
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const handled = useRef(false);
  const [unrecognized, setUnrecognized] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const onObjectsScanned = useCallback(
    (objects: ScannedObject[]) => {
      if (handled.current) {
        return;
      }
      const value = objects
        .filter(isScannedCode)
        .map(item => item.value)
        .find(item => typeof item === 'string');
      if (!value) {
        return;
      }
      handled.current = true;
      const parsed = parseAssetQr(value);
      if (!parsed) {
        setUnrecognized(true);
        return;
      }
      if (countId) {
        runCountScan(api, countId, parsed.id)
          .then(result => {
            setScanMessage(result.ok ? result.code : result.message);
            handled.current = false;
          })
          .catch(caught => {
            setScanMessage(isApiError(caught) ? caught.message : 'No hay conexión.');
            handled.current = false;
          });
        return;
      }
      navigation.replace('AssetDetail', { id: parsed.id, code: parsed.code });
    },
    [api, countId, navigation],
  );

  const output = useObjectOutput({
    types: QR_TYPES,
    onObjectsScanned,
  });

  if (!hasPermission) {
    return (
      <View style={[styles.message, { backgroundColor: colors.background }]}>
        <Text style={[styles.text, { color: colors.onSurface }]}>
          Se necesita la cámara para leer el QR.
        </Text>
        <Pressable
          onPress={() => {
            requestPermission().catch(() => undefined);
          }}
          style={[styles.button, { backgroundColor: colors.primary }]}>
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
            Permitir cámara
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={[styles.message, { backgroundColor: colors.background }]}>
        <Text style={[styles.text, { color: colors.onSurface }]}>
          No hay cámara disponible.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <Camera
        device={device}
        isActive={focused && !unrecognized}
        outputs={[output]}
        style={StyleSheet.absoluteFill}
      />
      {scanMessage ? (
        <View style={[styles.banner, { backgroundColor: colors.primaryContainer }]}>
          <Text style={[styles.text, { color: colors.onPrimaryContainer }]}>
            {scanMessage}
          </Text>
        </View>
      ) : null}
      {unrecognized ? (
        <View style={[styles.banner, { backgroundColor: colors.errorContainer }]}>
          <Text style={[styles.text, { color: colors.onErrorContainer }]}>
            QR no reconocido
          </Text>
          <Pressable
            onPress={() => {
              handled.current = false;
              setUnrecognized(false);
            }}
            style={[styles.button, { backgroundColor: colors.error }]}>
            <Text style={[styles.buttonText, { color: colors.onErrorContainer }]}>
              Volver a escanear
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000000' },
  message: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    borderRadius: radii.sheet,
    gap: 12,
    padding: 16,
  },
  text: {
    fontFamily: font.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    borderRadius: radii.control,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: {
    fontFamily: font.semibold,
    fontSize: 14,
  },
});
