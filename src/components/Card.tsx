import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { radii } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

export function Card({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.surfaceLowest,
      borderColor: colors.outlineVariant,
    },
    style,
  ];
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          pressed ? styles.pressed : null,
        ]}>
        {children}
      </Pressable>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 1,
    elevation: 1,
  },
  pressed: {
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
});
