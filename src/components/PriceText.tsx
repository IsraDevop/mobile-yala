import { StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { formatPrice } from "../utils/formatters";
import { palette } from "../theme/theme";

interface PriceTextProps {
  amount: number;
  label?: string;
  size?: "small" | "medium" | "large";
}

export function PriceText({ amount, label, size = "medium" }: PriceTextProps) {
  const variant =
    size === "large"
      ? "headlineMedium"
      : size === "small"
      ? "labelLarge"
      : "titleLarge";

  return (
    <>
      {label && (
        <Text variant="labelSmall" style={styles.label}>{label}</Text>
      )}
      <Text variant={variant} style={styles.price}>{formatPrice(amount)}</Text>
    </>
  );
}

const styles = StyleSheet.create({
  label: { color: palette.secondary, textTransform: "uppercase", letterSpacing: 1 },
  price: { color: palette.secondary, fontWeight: "800" },
});
