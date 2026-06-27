import { Image, Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { Order, OrderStatus } from "../types";
import { formatPrice } from "../utils/formatters";
import { palette, fonts } from "../theme/theme";

const STATUS_STYLE: Record<OrderStatus, { bg: string; fg: string }> = {
  PENDING: { bg: palette.warningBg, fg: palette.warning },
  CONFIRMED: { bg: palette.successBg, fg: palette.success },
  CANCELLED: { bg: "#F2F3F6", fg: "#8A8F98" },
};

interface OrderCardProps {
  order: Order;
  onPress: () => void;
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const imageUrl = order.listing?.imageUrls?.[0];
  const s = STATUS_STYLE[order.status];
  return (
    <Pressable onPress={onPress} style={[styles.card, order.status === "CANCELLED" && styles.dim]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.placeholder]}>
          <Text style={styles.placeholderText}>Yala</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text numberOfLines={1} style={styles.title}>{order.listing?.title ?? order.itemTitle ?? `Orden #${order.id}`}</Text>
        <Text style={styles.amount}>{formatPrice(order.amount)}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: s.bg }]}>
        <Text style={[styles.badgeText, { color: s.fg }]}>{order.status}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.borderLight,
    padding: 13,
    marginHorizontal: 18,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dim: { opacity: 0.7 },
  thumb: { width: 58, height: 58, borderRadius: 13, backgroundColor: palette.dark },
  placeholder: { justifyContent: "center", alignItems: "center" },
  placeholderText: { color: "#3A3D46", fontSize: 13, fontFamily: fonts.extrabold },
  info: { flex: 1 },
  title: { fontFamily: fonts.bold, fontSize: 14, color: palette.textPrimary, lineHeight: 17 },
  amount: { fontFamily: fonts.monoExtra, fontSize: 14, color: palette.textPrimary, marginTop: 4 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontFamily: fonts.monoBold, fontSize: 10 },
});
