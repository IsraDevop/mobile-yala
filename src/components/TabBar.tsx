import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { palette, fonts } from "../theme/theme";
import { useUnreadCount } from "../hooks/useUnreadCount";

const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap; label: string }> = {
  index: { on: "home", off: "home-outline", label: "Inicio" },
  auctions: { on: "radio", off: "radio-outline", label: "Live" },
  notifications: { on: "notifications", off: "notifications-outline", label: "Avisos" },
  profile: { on: "person", off: "person-outline", label: "Perfil" },
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { count } = useUnreadCount();

  const routes = state.routes.filter((r) => r.name !== "sell");
  const sellRoute = state.routes.find((r) => r.name === "sell");
  const left = routes.slice(0, 2);
  const right = routes.slice(2);

  function go(name: string, key: string, focused: boolean) {
    const event = navigation.emit({ type: "tabPress", target: key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) navigation.navigate(name);
  }

  function renderItem(route: (typeof state.routes)[number]) {
    const cfg = ICONS[route.name];
    if (!cfg) return null;
    const focused = state.routes[state.index].key === route.key;
    const color = focused ? palette.primary : "#A7ABB6";
    const showBadge = route.name === "notifications" && count > 0;
    return (
      <Pressable key={route.key} style={styles.item} onPress={() => go(route.name, route.key, focused)}>
        <View>
          <Ionicons name={focused ? cfg.on : cfg.off} size={22} color={color} />
          {showBadge && <View style={styles.badge} />}
        </View>
        <Text style={[styles.label, { color }]}>{cfg.label}</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom || 10 }]}>
      {left.map(renderItem)}
      {sellRoute && (
        <Pressable
          style={styles.fabWrap}
          onPress={() => go(sellRoute.name, sellRoute.key, false)}
        >
          <View style={styles.fab}>
            <Ionicons name="add" size={26} color="#fff" />
          </View>
        </Pressable>
      )}
      {right.map(renderItem)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ECEDF1",
    paddingTop: 11,
    alignItems: "flex-start",
  },
  item: { flex: 1, alignItems: "center", gap: 4 },
  label: { fontFamily: fonts.semibold, fontSize: 10 },
  fabWrap: { flex: 1, alignItems: "center" },
  fab: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: palette.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -6,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.secondary,
  },
});
