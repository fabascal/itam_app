import {
  createStaticNavigation,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSession } from '../auth/session';
import { AssetDetailScreen } from '../screens/AssetDetailScreen';
import { AssetsScreen } from '../screens/AssetsScreen';
import { DeniedScreen } from '../screens/DeniedScreen';
import { LocationsScreen } from '../screens/LocationsScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ScannerScreen } from '../screens/ScannerScreen';
import { useTheme } from '../theme/useTheme';

function useSignedOut() {
  return useSession().status === 'signedOut';
}

function useDenied() {
  return useSession().status === 'denied';
}

function useSignedIn() {
  return useSession().status === 'signedIn';
}

const MainStack = createNativeStackNavigator({
  screens: {
    Locations: {
      screen: LocationsScreen,
      options: { title: 'Ubicaciones' },
    },
    Assets: {
      screen: AssetsScreen,
      options: { title: 'Activos' },
    },
    AssetDetail: {
      screen: AssetDetailScreen,
      options: { title: 'Activo' },
    },
    Scanner: {
      screen: ScannerScreen,
      options: { title: 'Escanear' },
    },
  },
});

const RootStack = createNativeStackNavigator({
  screens: {
    Login: {
      screen: LoginScreen,
      if: useSignedOut,
      options: { headerShown: false },
    },
    Denied: {
      screen: DeniedScreen,
      if: useDenied,
      options: { headerShown: false },
    },
    Main: {
      screen: MainStack,
      if: useSignedIn,
      options: { headerShown: false },
    },
  },
});

const Navigation = createStaticNavigation(RootStack);

export function AppNavigation() {
  const { scheme, colors } = useTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <Navigation
      theme={{
        ...base,
        dark: scheme === 'dark',
        colors: {
          ...base.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.onSurface,
          border: colors.outlineVariant,
          notification: colors.error,
        },
      }}
    />
  );
}
