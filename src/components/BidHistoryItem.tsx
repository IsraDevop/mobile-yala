import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { Bid } from "../types";
import { formatPrice, getAvatarInitials } from "../utils/formatters";
import { palette, fonts } from "../theme/theme";

interface BidHistoryItemProps {
  bid: Bid;
  isHighest?: boolean;
}

export function BidHistoryItem({ bid, isHighest }: BidHistoryItemProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getAvatarInitials(bid.bidder.name)}</Text>
        </View>
        <Text style={styles.name}>{bid.bidder.name}</Text>
        {isHighest && <Text style={styles.tag}>· más alta</Text>}
      </View>
      <Text style={[styles.amount, isHighest && styles.amountHigh]}>
        {formatPrice(bid.amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F3F6",
  },
  left: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.avatarBg,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: palette.primary, fontFamily: fonts.extrabold, fontSize: 10 },
  name: { fontSize: 13, color: "#5A5F6A", fontFamily: fonts.semibold },
  tag: { fontSize: 11, color: palette.secondary, fontFamily: fonts.semibold },
  amount: { fontFamily: fonts.monoBold, fontSize: 13, color: palette.textPrimary },
  amountHigh: { color: palette.secondary },
});
