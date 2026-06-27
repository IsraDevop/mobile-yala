import { useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { usePaginatedFetch } from "../src/hooks/usePaginatedFetch";
import { OrderCard } from "../src/components/OrderCard";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { Loader } from "../src/components/Loader";
import { EmptyState } from "../src/components/EmptyState";
import { ErrorView } from "../src/components/ErrorView";
import type { Order, OrderStatus } from "../src/types";
import { palette, fonts } from "../src/theme/theme";

type Filter = "ALL" | "PENDING" | "CONFIRMED";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL", label: "Todas" },
  { key: "PENDING", label: "Pendientes" },
  { key: "CONFIRMED", label: "Confirmadas" },
];

export default function OrdersScreen() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const { items, loading, loadingMore, error, loadMore, refresh } =
    usePaginatedFetch<Order>("/orders/my-orders");

  const filtered = filter === "ALL" ? items : items.filter((o) => o.status === (filter as OrderStatus));

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Mis órdenes" />
      <Pressable style={styles.pendingBanner} onPress={() => router.push("/pending-payments")}>
        <Ionicons name="wallet-outline" size={18} color={palette.secondary} />
        <Text style={styles.pendingText}>Pendientes de pago (48 h)</Text>
        <Ionicons name="chevron-forward" size={16} color={palette.secondary} />
      </Pressable>
      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.pill, active ? styles.pillActive : styles.pillIdle]}
            >
              <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextIdle]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <ErrorView message={error} onRetry={refresh} />
      ) : loading && items.length === 0 ? (
        <Loader />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => String(o.id)}
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={() => router.push(`/order/${item.id}`)} />
          )}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          onRefresh={refresh}
          refreshing={loadingMore}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="Sin órdenes"
              description="Tus compras y ventas van a aparecer acá."
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 18,
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FDEEE7",
  },
  pendingText: { flex: 1, fontFamily: fonts.bold, fontSize: 13, color: palette.secondary },
  filters: { flexDirection: "row", gap: 8, paddingHorizontal: 18, paddingTop: 4, paddingBottom: 12 },
  pill: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  pillActive: { backgroundColor: palette.primary },
  pillIdle: { backgroundColor: palette.fill },
  pillText: { fontFamily: fonts.bold, fontSize: 12 },
  pillTextActive: { color: "#fff" },
  pillTextIdle: { color: "#5A5F6A" },
  list: { paddingTop: 4, paddingBottom: 24 },
});
