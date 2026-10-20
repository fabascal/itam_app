import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { isApiError, useSession } from '../auth/session';
import { Logo } from '../components/Logo';
import { font, radii } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

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
      setError(isApiError(caught) ? caught.message : 'No hay conexión.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.form}>
        <Logo />
        <Text style={[styles.title, { color: colors.onSurface }]}>
          Iniciar sesión
        </Text>
        <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
          Correo
        </Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="usuario@combu-express.com.mx"
          placeholderTextColor={colors.outline}
          style={[
            styles.input,
            {
              color: colors.onSurface,
              borderColor: colors.outlineVariant,
              backgroundColor: colors.surfaceLowest,
            },
          ]}
          textContentType="username"
          value={email}
        />
        <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
          Contraseña
        </Text>
        <TextInput
          onChangeText={setPassword}
          placeholder="Contraseña"
          placeholderTextColor={colors.outline}
          secureTextEntry
          style={[
            styles.input,
            {
              color: colors.onSurface,
              borderColor: colors.outlineVariant,
              backgroundColor: colors.surfaceLowest,
            },
          ]}
          textContentType="password"
          value={password}
        />
        {notice ? (
          <Text style={[styles.error, { color: colors.error }]}>{notice}</Text>
        ) : null}
        {error ? (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        ) : null}
        <Pressable
          disabled={busy}
          onPress={submit}
          style={[styles.button, { backgroundColor: colors.primary }]}>
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
            {busy ? 'Cargando...' : 'Iniciar sesión'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  form: {
    gap: 8,
  },
  title: {
    fontFamily: font.semibold,
    fontSize: 24,
    marginTop: 24,
    marginBottom: 8,
  },
  label: {
    fontFamily: font.medium,
    fontSize: 12,
    marginTop: 8,
  },
  input: {
    borderRadius: radii.control,
    borderWidth: 1,
    fontFamily: font.regular,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  error: {
    fontFamily: font.regular,
    fontSize: 14,
    marginTop: 8,
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
