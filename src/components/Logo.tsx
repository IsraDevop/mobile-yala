import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { palette, fonts } from "../theme/theme";

interface Props {
  size?: number;
  showWordmark?: boolean;
}

export function Logo({ size = 24, showWordmark = true }: Props) {
  const box = size * 1.35;
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.mark,
          { width: box, height: box, borderRadius: box * 0.32 },
        ]}
      >
        <Ionicons name="arrow-up" size={box * 0.62} color="#fff" />
      </View>
      {showWordmark && (
        <Text
          style={[styles.word, { fontSize: size, fontFamily: fonts.extrabold }]}
        >
          Yala
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  mark: {
    backgroundColor: palette.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  word: { color: palette.textPrimary, letterSpacing: -0.5 },
});
