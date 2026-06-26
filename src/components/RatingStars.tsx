import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "../theme/theme";

interface RatingStarsProps {
  rating: number;
  showValue?: boolean;
  size?: number;
}

export function RatingStars({ rating, showValue = true, size = 16 }: RatingStarsProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= Math.round(rating) ? "star" : "star-outline"}
          size={size}
          color={star <= Math.round(rating) ? "#FBBF24" : palette.border}
        />
      ))}
      {showValue && (
        <Text variant="labelMedium" style={styles.value}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 2 },
  value: { color: palette.textSecondary, marginLeft: 4 },
});
