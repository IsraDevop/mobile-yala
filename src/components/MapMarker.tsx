import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { palette } from "../theme/theme";

interface Props {
  label: string;
}

export function MapMarker({ label }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center" },
  label: {
    backgroundColor: palette.primary,
    color: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
  },
  pin: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: palette.primary,
  },
});
