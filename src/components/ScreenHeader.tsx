import { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette, fonts } from "../theme/theme";

interface Props {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onBack?: () => void;
  right?: ReactNode;
}

export function ScreenHeader({ title, icon = "chevron-back", onBack, right }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Pressable
        style={styles.left}
        onPress={onBack ?? (() => router.back())}
        hitSlop={8}
      >
        <Ionicons name={icon} size={22} color={palette.textPrimary} />
        <Text style={styles.title}>{title}</Text>
      </Pressable>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 8,
    backgroundColor: palette.background,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontFamily: fonts.bold, fontSize: 15, color: "#3A3D46" },
});
