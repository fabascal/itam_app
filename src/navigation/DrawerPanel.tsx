import { CommonActions, DrawerActions } from '@react-navigation/native';
import {
  DrawerContentScrollView,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { ClipboardCheck, MapPin, QrCode, User } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSession } from '../auth/session';
import { Logo } from '../components/Logo';
import { font, radii } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

const items = [
  { name: 'Locations', label: 'Ubicaciones', icon: MapPin },
  { name: 'Counts', label: 'Conteos', icon: ClipboardCheck },
  { name: 'Profile', label: 'Perfil', icon: User },
] as const;

export function DrawerPanel(props: DrawerContentComponentProps) {
  const { colors } = useTheme();
  const { user, signOut } = useSession();
  const active = props.state.routes[props.state.index]?.name;

  return (
    <View style={[styles.panel, { backgroundColor: colors.surface }]}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scroll}>
        <View style={styles.logo}>
          <Logo />
        </View>
        <Text style={[styles.name, { color: colors.onSurface }]}>
          {user?.fullName ?? 'Usuario'}
        </Text>
        <Text style={[styles.role, { color: colors.onSurfaceVariant }]}>
          {user?.role.name ?? ''}
        </Text>
        {items.map(item => {
          const Icon = item.icon;
          const selected = active === item.name;
          return (
            <Pressable
              key={item.name}
              onPress={() => props.navigation.navigate(item.name)}
              style={[
                styles.item,
                selected
                  ? { backgroundColor: colors.primaryContainer }
                  : null,
              ]}>
              <Icon
                color={selected ? colors.onPrimaryContainer : colors.onSurface}
                size={20}
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.itemLabel,
                  {
                    color: selected
                      ? colors.onPrimaryContainer
                      : colors.onSurface,
                  },
                ]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => {
            props.navigation.dispatch(DrawerActions.closeDrawer());
            props.navigation.getParent()?.dispatch(
              CommonActions.navigate({ name: 'Scanner', params: {} }),
            );
          }}
          style={styles.item}>
          <QrCode color={colors.onSurface} size={20} strokeWidth={2} />
          <Text style={[styles.itemLabel, { color: colors.onSurface }]}>
            Escanear
          </Text>
        </Pressable>
      </DrawerContentScrollView>
      <Pressable
        onPress={() => {
          signOut().catch(() => undefined);
        }}
        style={styles.logout}>
        <Text style={[styles.logoutLabel, { color: colors.error }]}>
          Cerrar sesión
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1 },
  scroll: { paddingBottom: 16 },
  logo: { paddingHorizontal: 16, paddingTop: 8 },
  name: {
    fontFamily: font.semibold,
    fontSize: 16,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  role: {
    fontFamily: font.medium,
    fontSize: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  item: {
    alignItems: 'center',
    borderRadius: radii.control,
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 12,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  itemLabel: {
    fontFamily: font.medium,
    fontSize: 14,
  },
  logout: {
    padding: 20,
  },
  logoutLabel: {
    fontFamily: font.semibold,
    fontSize: 14,
  },
});
