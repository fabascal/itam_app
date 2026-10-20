import { Image, StyleSheet, Text, View } from 'react-native';
import { font } from '../theme/tokens';

const favicon = require('../../favicon.png');

export const brandHeader = {
  headerStyle: { backgroundColor: '#004B87' },
  headerTintColor: '#ffffff',
  headerTitleStyle: {
    fontFamily: font.semibold,
    color: '#ffffff',
  },
  headerTitle: AppHeaderTitle,
};

function AppHeaderTitle({ children }: { children?: string }) {
  return (
    <View style={styles.row}>
      <Image source={favicon} style={styles.icon} />
      <Text style={styles.title}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  icon: {
    height: 22,
    width: 22,
    borderRadius: 4,
  },
  title: {
    color: '#ffffff',
    fontFamily: font.semibold,
    fontSize: 16,
  },
});
