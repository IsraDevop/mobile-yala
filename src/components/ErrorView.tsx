import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { palette } from "../theme/theme";

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <View style={styles.container}>
      <Text variant="bodyLarge" style={styles.text}>{message}</Text>
      {onRetry && (
        <Button mode="outlined" onPress={onRetry} style={styles.btn}>
          Reintentar
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  text: { color: palette.textSecondary, textAlign: "center", marginBottom: 16 },
  btn: { borderColor: palette.primary },
});
