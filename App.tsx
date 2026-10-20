import { StatusBar, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SessionProvider, useSession } from './src/auth/session';
import { LoadingState } from './src/components/LoadingState';
import { AppNavigation } from './src/navigation/AppNavigation';
import { useTheme } from './src/theme/useTheme';

function Gate() {
  const { ready } = useSession();
  const { scheme, colors } = useTheme();
  if (!ready) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background }]}>
        <LoadingState />
      </View>
    );
  }
  return (
    <>
      <StatusBar
        barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
      />
      <AppNavigation />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.fill}>
      <SessionProvider>
        <Gate />
      </SessionProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
