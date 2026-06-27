import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { palette, fonts } from "../theme/theme";

interface RatingStarsProps {
  rating: number;
  count?: number;
  showValue?: boolean;
  size?: number;
  starColor?: string;
  textColor?: string;
}

export function RatingStars({
  rating,
  count,
  showValue = true,
  size = 14,
  starColor = palette.star,
  textColor = palette.textSecondary,
}: RatingStarsProps) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= Math.round(rating) ? "star" : "star-outline"}
          size={size}
          color={star <= Math.round(rating) ? starColor : "#D7D9E0"}
        />
      ))}
      {showValue && (
        <Text style={[styles.value, { color: textColor, fontSize: size - 2 }]}>
          {rating.toFixed(1)}
          {count != null ? ` (${count})` : ""}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 2 },
  value: { fontFamily: fonts.monoBold, marginLeft: 5 },
});
