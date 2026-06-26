import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "../theme/theme";

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
      <Ionicons name={icon} size={56} color={palette.primary} style={styles.icon} />
      <Text variant="titleMedium" style={styles.title}>{title}</Text>
      {description && (
        <Text variant="bodyMedium" style={styles.desc}>{description}</Text>
      )}
      {ctaLabel && onCta && (
        <Button mode="contained" onPress={onCta} style={styles.btn}>
          {ctaLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  icon: { marginBottom: 16, opacity: 0.7 },
  title: { fontWeight: "700", color: palette.textPrimary, textAlign: "center", marginBottom: 8 },
  desc: { color: palette.textSecondary, textAlign: "center", marginBottom: 20 },
  btn: { backgroundColor: palette.primary },
});
