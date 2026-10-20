import { Pressable, StyleSheet, Text, View } from 'react-native';
import { font, radii } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

export function ErrorState({
  message,
  onRetry,
  onBack,
}: {
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
}) {
  const { colors } = useTheme();
  const action = onRetry ?? onBack;
  const label = onRetry ? 'Reintentar' : 'Volver';
  return (
    <View style={styles.center}>
      <Text style={[styles.message, { color: colors.onSurface }]}>{message}</Text>
      {action ? (
        <Pressable
          onPress={action}
          style={[styles.button, { backgroundColor: colors.primary }]}>
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
            {label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
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
