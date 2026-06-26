import { StyleSheet, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { palette } from "../theme/theme";

export function Loader({ size = "large" }: { size?: "small" | "large" }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={palette.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});
