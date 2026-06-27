import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { palette, fonts } from "../theme/theme";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ icon = "cube-outline", title, description, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={28} color={palette.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.desc}>{description}</Text>}
      {ctaLabel && onCta && (
        <Button
          mode="contained"
          onPress={onCta}
          style={styles.btn}
          labelStyle={styles.btnLabel}
        >
          {ctaLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 30, paddingVertical: 48 },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: palette.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  title: { fontFamily: fonts.extrabold, fontSize: 16, color: palette.textPrimary, textAlign: "center" },
  desc: { fontFamily: fonts.regular, fontSize: 13, color: palette.textTertiary, textAlign: "center", marginTop: 5 },
  btn: { backgroundColor: palette.primary, borderRadius: 14, marginTop: 20 },
  btnLabel: { fontFamily: fonts.bold },
});
