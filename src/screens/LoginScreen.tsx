import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Lock, Mail } from 'lucide-react-native';
import { isApiError, useSession } from '../auth/session';
import { Logo } from '../components/Logo';
import { font, radii } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

const station = require('../../estacion-ener.jpg');

export function LoginScreen() {
  const { colors } = useTheme();
  const { signIn, notice } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || !password) {
      setError('Datos inválidos');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (caught) {
      setError(
        isApiError(caught)
          ? caught.status === 401
            ? 'Las credenciales son incorrectas'
            : caught.message
          : 'No hay conexión.',
      );
    } finally {
      setBusy(false);
    }
  }

  const message = error ?? notice;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Image source={station} style={styles.photo} />
          <View style={styles.veil} />
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Portal de Gestión de Activos ITAM</Text>
            <Text style={styles.heroBody}>
              Controla equipos, vehículos y reportes de tu operación en un solo lugar.
            </Text>
          </View>
        </View>
        <View style={styles.form}>
          <Logo />
          <Text style={[styles.title, { color: colors.onSurface }]}>
            Iniciar sesión
          </Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Ingresa tus credenciales para acceder al portal administrativo.
          </Text>
          {message ? (
            <View
              style={[
                styles.alert,
                {
                  backgroundColor: colors.errorContainer,
                  borderColor: colors.errorContainer,
                },
              ]}>
              <Text style={[styles.alertText, { color: colors.onErrorContainer }]}>
                {message}
              </Text>
            </View>
          ) : null}
          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
            Correo electrónico
          </Text>
          <View
            style={[
              styles.field,
              {
                borderColor: colors.outline,
                backgroundColor: colors.surfaceLowest,
              },
            ]}>
            <Mail color={colors.onSurfaceVariant} size={20} strokeWidth={2} />
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="admin@combu-express.com.mx"
              placeholderTextColor={colors.outline}
              style={[styles.input, { color: colors.onSurface }]}
              textContentType="username"
              value={email}
            />
          </View>
          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
            Contraseña
          </Text>
          <View
            style={[
              styles.field,
              {
                borderColor: colors.outline,
                backgroundColor: colors.surfaceLowest,
              },
            ]}>
            <Lock color={colors.onSurfaceVariant} size={20} strokeWidth={2} />
            <TextInput
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.outline}
              secureTextEntry
              style={[styles.input, { color: colors.onSurface }]}
              textContentType="password"
              value={password}
            />
          </View>
          <Pressable
            disabled={busy}
            onPress={submit}
            style={[styles.button, { backgroundColor: colors.brand }]}>
            <Text style={[styles.buttonText, { color: colors.onBrand }]}>
              {busy ? 'Ingresando...' : 'Ingresar al portal'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: {
    height: 280,
    justifyContent: 'flex-end',
  },
  photo: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: 280,
  },
  veil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,50,92,0.82)',
  },
  heroText: {
    padding: 24,
  },
  heroTitle: {
    color: '#ffffff',
    fontFamily: font.semibold,
    fontSize: 24,
  },
  heroBody: {
    color: 'rgba(255,255,255,0.92)',
    fontFamily: font.regular,
    fontSize: 14,
    marginTop: 8,
  },
  form: {
    gap: 8,
    padding: 24,
  },
  title: {
    fontFamily: font.bold,
    fontSize: 24,
    marginTop: 16,
  },
  subtitle: {
    fontFamily: font.regular,
    fontSize: 14,
    marginBottom: 8,
  },
  alert: {
    borderRadius: radii.control,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  alertText: {
    fontFamily: font.regular,
    fontSize: 14,
  },
  label: {
    fontFamily: font.medium,
    fontSize: 14,
    marginTop: 8,
  },
  field: {
    alignItems: 'center',
    borderRadius: radii.control,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 14,
    paddingVertical: 12,
  },
  button: {
    alignItems: 'center',
    borderRadius: radii.control,
    marginTop: 16,
    paddingVertical: 14,
  },
  buttonText: {
    fontFamily: font.semibold,
    fontSize: 14,
  },
});
