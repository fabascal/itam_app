import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { font } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

export function LoadingState() {
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[styles.text, { color: colors.onSurfaceVariant }]}>
        Cargando...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: {
    fontFamily: font.regular,
    fontSize: 14,
  },
});
