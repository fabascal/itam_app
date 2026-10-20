import { Image, StyleSheet, View } from 'react-native';
import { radii } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

const source = require('../../assets/logo-combu-express.png');

export function Logo() {
  const { scheme } = useTheme();
  return (
    <View style={scheme === 'dark' ? styles.plate : styles.plain}>
      <Image source={source} style={styles.image} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  plain: {
    alignItems: 'center',
  },
  plate: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: radii.card,
    padding: 12,
  },
  image: {
    width: 240,
    height: 64,
  },
});
