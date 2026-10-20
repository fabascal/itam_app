import { StyleSheet, Text, View } from 'react-native';
import type { AssetStatus } from '../api/types';
import { font } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

const labels: Record<AssetStatus, string> = {
  AVAILABLE: 'Disponible',
  ASSIGNED: 'Asignado',
  MAINTENANCE: 'Mantenimiento',
  SCRAP: 'Baja',
};

export function StatusChip({ status }: { status: AssetStatus }) {
  const { colors } = useTheme();
  const palette = {
    AVAILABLE: {
      backgroundColor: colors.primaryContainer,
      color: colors.onPrimaryContainer,
    },
    ASSIGNED: {
      backgroundColor: colors.secondaryContainer,
      color: colors.onSecondaryContainer,
    },
    MAINTENANCE: {
      backgroundColor: colors.tertiaryContainer,
      color: colors.onTertiaryContainer,
    },
    SCRAP: {
      backgroundColor: colors.errorContainer,
      color: colors.onErrorContainer,
    },
  }[status];

  return (
    <View style={[styles.chip, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.label, { color: palette.color }]}>
        {labels[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontFamily: font.medium,
    fontSize: 12,
  },
});
