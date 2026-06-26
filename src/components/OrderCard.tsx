import { Pressable, StyleSheet, View } from "react-native";
import { Card, Chip, Text } from "react-native-paper";
import type { Order, OrderStatus } from "../types";
import { formatPrice, formatDate } from "../utils/formatters";
import { palette } from "../theme/theme";

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "#FCD34D",
  CONFIRMED: "#16A34A",
  CANCELLED: "#9CA3AF",
};

interface OrderCardProps {
  order: Order;
  onPress: () => void;
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card} elevation={1}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="labelSmall" style={styles.id}>Orden #{order.id}</Text>
            <Chip
              compact
              style={{ backgroundColor: STATUS_COLORS[order.status] + "30" }}
              textStyle={{ color: STATUS_COLORS[order.status] }}
            >
              {STATUS_LABELS[order.status]}
            </Chip>
          </View>
          <Text variant="titleSmall" numberOfLines={1} style={styles.title}>
            {order.listing.title}
          </Text>
          <View style={styles.footer}>
            <Text variant="titleMedium" style={styles.amount}>
              {formatPrice(order.amount)}
            </Text>
            <Text variant="labelSmall" style={styles.date}>
              {formatDate(order.createdAt)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 12, marginHorizontal: 16, marginVertical: 6 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  id: { color: palette.textSecondary },
  title: { color: palette.textPrimary, fontWeight: "600", marginBottom: 8 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  amount: { color: palette.secondary, fontWeight: "800" },
  date: { color: palette.textSecondary },
});
