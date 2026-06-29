import { FlatList, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { usePaginatedFetch } from "../src/hooks/usePaginatedFetch";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { Loader } from "../src/components/Loader";
import { EmptyState } from "../src/components/EmptyState";
import { ErrorView } from "../src/components/ErrorView";
import { palette, fonts } from "../src/theme/theme";
import { formatPrice, formatDate } from "../src/utils/formatters";
import type { Order, OrderStatus } from "../src/types";

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pendiente de pago",
  CONFIRMED: "Pagada",
  CANCELLED: "Cancelada",
};

const STATUS_COLOR: Record<OrderStatus, { bg: string; fg: string }> = {
  PENDING: { bg: palette.warningBg, fg: palette.warning },
  CONFIRMED: { bg: palette.successBg, fg: palette.success },
  CANCELLED: { bg: "#F2F3F6", fg: "#8A8F98" },
};

function SaleRow({ order }: { order: Order }) {
  const s = STATUS_COLOR[order.status];
  const title = order.listing?.title ?? order.itemTitle ?? `Orden #${order.id}`;
  const buyer = order.buyer?.name ?? "—";
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text numberOfLines={1} style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowBuyer}>{buyer}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowAmount}>{formatPrice(order.amount)}</Text>
        <View style={[styles.badge, { backgroundColor: s.bg }]}>
          <Text style={[styles.badgeText, { color: s.fg }]}>{STATUS_LABEL[order.status]}</Text>
        </View>
        {order.paymentDeadline && order.status === "PENDING" && (
          <Text style={styles.deadline}>Pagar antes de {formatDate(order.paymentDeadline)}</Text>
        )}
      </View>
    </View>
  );
}

export default function MySalesScreen() {
  const { items, loading, error, loadMore, refresh } = usePaginatedFetch<Order>(
    "/orders/my-sales",
    20
  );

  if (loading && items.length === 0) return <Loader />;
  if (error) return <ErrorView message={error} onRetry={refresh} />;

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Mis ventas / Ganadores" />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <SaleRow order={item} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        onRefresh={refresh}
        refreshing={loading}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="storefront-outline"
            title="Sin ventas aún"
            description="Aquí aparecerán las órdenes de tus compradores y ganadores de tus subastas."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  list: { padding: 18, paddingBottom: 36, flexGrow: 1 },
  row: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.borderLight,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  rowMain: { flex: 1 },
  rowTitle: { fontFamily: fonts.bold, fontSize: 14, color: palette.textPrimary, lineHeight: 18 },
  rowBuyer: { fontFamily: fonts.regular, fontSize: 12, color: palette.textTertiary, marginTop: 3 },
  rowRight: { alignItems: "flex-end", gap: 4 },
  rowAmount: { fontFamily: fonts.monoExtra, fontSize: 15, color: palette.textPrimary },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  badgeText: { fontFamily: fonts.monoBold, fontSize: 10 },
  deadline: { fontFamily: fonts.mono, fontSize: 10, color: palette.warning, marginTop: 2 },
});
