import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { palette, fonts } from "../theme/theme";

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Ionicons name="cloud-offline-outline" size={26} color={palette.error} />
      </View>
      <Text style={styles.text}>{message}</Text>
      {onRetry && (
        <Button
          mode="contained"
          onPress={onRetry}
          style={styles.btn}
          labelStyle={styles.btnLabel}
        >
          Reintentar
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: palette.background },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#FCEBEA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  text: { fontFamily: fonts.medium, color: palette.textSecondary, textAlign: "center", marginBottom: 18 },
  btn: { backgroundColor: palette.primary, borderRadius: 14 },
  btnLabel: { fontFamily: fonts.bold },
});
