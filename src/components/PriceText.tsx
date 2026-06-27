import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { formatPrice } from "../utils/formatters";
import { palette, fonts } from "../theme/theme";

interface PriceTextProps {
  amount: number;
  label?: string;
  size?: "small" | "medium" | "large";
  tone?: "auction" | "fixed";
}

const SIZES = { small: 16, medium: 20, large: 28 };

export function PriceText({ amount, label, size = "medium", tone = "auction" }: PriceTextProps) {
  const color = tone === "auction" ? palette.secondary : palette.textPrimary;
  return (
    <View>
      {label && (
        <View style={styles.labelRow}>
          {tone === "auction" && <View style={styles.dot} />}
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
      <Text style={[styles.price, { fontSize: SIZES[size], color }]}>
        {formatPrice(amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.secondary },
  label: {
    fontFamily: fonts.monoBold,
    fontSize: 10,
    color: palette.secondary,
    letterSpacing: 0.6,
  },
  price: { fontFamily: fonts.monoExtra },
});
