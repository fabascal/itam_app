import {
  createStaticNavigation,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSession } from '../auth/session';
import { AssetDetailScreen } from '../screens/AssetDetailScreen';
import { AssetsScreen } from '../screens/AssetsScreen';
import { CountCreateScreen } from '../screens/CountCreateScreen';
import { CountDetailScreen } from '../screens/CountDetailScreen';
import { CountsScreen } from '../screens/CountsScreen';
import { DeniedScreen } from '../screens/DeniedScreen';
import { LocationsScreen } from '../screens/LocationsScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ScannerScreen } from '../screens/ScannerScreen';
import { useTheme } from '../theme/useTheme';
import { DrawerPanel } from './DrawerPanel';
import { brandHeader } from './header';

function useSignedOut() {
  return useSession().status === 'signedOut';
}

function useDenied() {
  return useSession().status === 'denied';
}

function useSignedIn() {
  return useSession().status === 'signedIn';
}

const AppDrawer = createDrawerNavigator({
  drawerContent: props => <DrawerPanel {...props} />,
  screenOptions: {
    ...brandHeader,
    drawerType: 'front',
  },
  screens: {
    Locations: {
      screen: LocationsScreen,
      options: { title: 'Ubicaciones' },
    },
    Counts: {
      screen: CountsScreen,
      options: { title: 'Conteos' },
    },
    Profile: {
      screen: ProfileScreen,
      options: { title: 'Perfil' },
    },
  },
});

const MainStack = createNativeStackNavigator({
  screenOptions: {
    ...brandHeader,
    statusBarStyle: 'light',
  },
  screens: {
    Home: {
      screen: AppDrawer,
      options: { headerShown: false },
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
    CountDetail: {
      screen: CountDetailScreen,
      options: { title: 'Conteo' },
    },
    CountCreate: {
      screen: CountCreateScreen,
      options: { title: 'Nuevo conteo' },
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
          primary: colors.onBrand,
          background: colors.background,
          card: colors.brand,
          text: colors.onBrand,
          border: colors.outlineVariant,
          notification: colors.error,
        },
      }}
    />
  );
}
