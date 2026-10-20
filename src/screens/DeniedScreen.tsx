import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSession } from '../auth/session';
import { font, radii } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

export function DeniedScreen() {
  const { colors } = useTheme();
  const { signOut } = useSession();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text style={[styles.message, { color: colors.onSurface }]}>
        Sin permisos suficientes
      </Text>
      <Pressable
        onPress={() => {
          signOut().catch(() => undefined);
        }}
        style={[styles.button, { backgroundColor: colors.primary }]}>
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
          Cerrar sesión
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  message: {
    fontFamily: font.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    borderRadius: radii.control,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: {
    fontFamily: font.semibold,
    fontSize: 14,
  },
});
