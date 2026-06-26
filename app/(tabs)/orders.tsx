import { useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import { Button, Dialog, Portal, Text } from "react-native-paper";
import { router } from "expo-router";
import { usePaginatedFetch } from "../../src/hooks/usePaginatedFetch";
import { OrderCard } from "../../src/components/OrderCard";
import { Loader } from "../../src/components/Loader";
import { EmptyState } from "../../src/components/EmptyState";
import { ErrorView } from "../../src/components/ErrorView";
import { useAuth } from "../../src/context/AuthContext";
import { useToast } from "../../src/context/ToastContext";
import { orderService } from "../../src/services/orderService";
import { getApiErrorMessage } from "../../src/utils/apiError";
import type { Order } from "../../src/types";
import { palette } from "../../src/theme/theme";

export default function OrdersScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{ orderId: number; action: "confirm" | "cancel" } | null>(null);
  const [acting, setActing] = useState(false);

  const { items, loading, loadingMore, error, loadMore, refresh } =
    usePaginatedFetch<Order>("/orders/my-orders");

  async function handleAction() {
    if (!confirmDialog) return;
    try {
      setActing(true);
      if (confirmDialog.action === "confirm") {
        await orderService.confirm(confirmDialog.orderId);
        showToast("Orden confirmada correctamente", "success");
      } else {
        await orderService.cancel(confirmDialog.orderId);
        showToast("Orden cancelada", "info");
      }
      refresh();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setActing(false);
      setConfirmDialog(null);
    }
  }

  if (loading) return <Loader />;
  if (error) return <ErrorView message={error} onRetry={refresh} />;

  return (
    <View style={styles.flex}>
      <FlatList
        data={items}
        keyExtractor={(o) => String(o.id)}
        renderItem={({ item }) => (
          <View>
            <OrderCard order={item} onPress={() => router.push(`/listing/${item.listing.id}`)} />
            <View style={styles.actions}>
              {item.status === "PENDING" && item.seller.id === user?.id && (
                <Button
                  mode="contained"
                  compact
                  onPress={() => setConfirmDialog({ orderId: item.id, action: "confirm" })}
                  style={styles.confirmBtn}
                >
                  Confirmar
                </Button>
              )}
              {item.status === "PENDING" && (
                <Button
                  mode="outlined"
                  compact
                  onPress={() => setConfirmDialog({ orderId: item.id, action: "cancel" })}
                  style={styles.cancelBtn}
                  textColor={palette.error}
                >
                  Cancelar
                </Button>
              )}
            </View>
          </View>
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        onRefresh={refresh}
        refreshing={loading}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="Sin órdenes"
            description="Tus compras y ventas aparecerán aquí"
          />
        }
        contentContainerStyle={styles.list}
      />

      <Portal>
        <Dialog visible={!!confirmDialog} onDismiss={() => setConfirmDialog(null)}>
          <Dialog.Title>
            {confirmDialog?.action === "confirm" ? "Confirmar orden" : "Cancelar orden"}
          </Dialog.Title>
          <Dialog.Content>
            <Text>
              {confirmDialog?.action === "confirm"
                ? "¿Confirmas que enviaste el producto al comprador?"
                : "¿Seguro que querés cancelar esta orden?"}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDialog(null)}>No</Button>
            <Button
              onPress={handleAction}
              loading={acting}
              disabled={acting}
              textColor={confirmDialog?.action === "cancel" ? palette.error : undefined}
            >
              Sí
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  list: { paddingVertical: 8 },
  actions: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  confirmBtn: { backgroundColor: palette.primary },
  cancelBtn: { borderColor: palette.error },
});
