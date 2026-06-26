import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { Bid } from "../types";
import { formatPrice, formatDateTime, getAvatarInitials } from "../utils/formatters";
import { palette } from "../theme/theme";

interface BidHistoryItemProps {
  bid: Bid;
  isHighest?: boolean;
}

export function BidHistoryItem({ bid, isHighest }: BidHistoryItemProps) {
  return (
    <View style={[styles.row, isHighest && styles.highlighted]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {getAvatarInitials(bid.bidder.name)}
        </Text>
      </View>
      <View style={styles.info}>
        <Text variant="bodyMedium" style={styles.name}>
          {bid.bidder.name}
          {isHighest && (
            <Text style={styles.badge}> · Puja más alta</Text>
          )}
        </Text>
        <Text variant="labelSmall" style={styles.date}>
          {formatDateTime(bid.placedAt)}
        </Text>
      </View>
      <Text variant="titleMedium" style={styles.amount}>
        {formatPrice(bid.amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    backgroundColor: "#fff",
  },
  highlighted: { backgroundColor: "#FFF7ED" },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  info: { flex: 1 },
  name: { color: palette.textPrimary, fontWeight: "600" },
  badge: { color: palette.secondary, fontWeight: "600" },
  date: { color: palette.textSecondary },
  amount: { color: palette.secondary, fontWeight: "800" },
});
