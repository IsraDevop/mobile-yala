import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { palette, fonts } from "../theme/theme";

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: "primary" | "secondary" | "soft";
}

export function PrimaryButton({ label, onPress, loading, disabled, icon, variant = "primary" }: Props) {
  const bg =
    variant === "secondary" ? palette.secondary : variant === "soft" ? palette.primaryContainer : palette.primary;
  const fg = variant === "soft" ? palette.primary : "#fff";
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.btn, { backgroundColor: bg, opacity: isDisabled ? 0.6 : 1 }]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={20} color={fg} />}
          <Text style={[styles.label, { color: fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { height: 54, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontFamily: fonts.extrabold, fontSize: 16 },
});
