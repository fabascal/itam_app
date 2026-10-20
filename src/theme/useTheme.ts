import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type Colors } from './tokens';

export function useTheme(): { scheme: 'light' | 'dark'; colors: Colors } {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, colors: scheme === 'dark' ? darkColors : lightColors };
}
