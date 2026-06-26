import { FlatList, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { usePaginatedFetch } from "../../src/hooks/usePaginatedFetch";
import { NotificationItem } from "../../src/components/NotificationItem";
import { Loader } from "../../src/components/Loader";
import { EmptyState } from "../../src/components/EmptyState";
import { ErrorView } from "../../src/components/ErrorView";
import { useToast } from "../../src/context/ToastContext";
import { notificationService } from "../../src/services/notificationService";
import { getApiErrorMessage } from "../../src/utils/apiError";
import type { Notification } from "../../src/types";
import { palette } from "../../src/theme/theme";

export default function NotificationsScreen() {
  const { showToast } = useToast();
  const { items, loading, loadMore, refresh, error } =
    usePaginatedFetch<Notification>("/notifications");

  async function handleMarkAsRead(id: number) {
    try {
      await notificationService.markAsRead(id);
      refresh();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  async function handleMarkAllRead() {
    try {
      await notificationService.markAllAsRead();
      showToast("Todas las notificaciones marcadas como leídas", "success");
      refresh();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  if (loading) return <Loader />;
  if (error) return <ErrorView message={error} onRetry={refresh} />;

  return (
    <View style={styles.flex}>
      {items.some((n) => !n.isRead) && (
        <View style={styles.markAllRow}>
          <Button compact onPress={handleMarkAllRead} textColor={palette.primary}>
            Marcar todas como leídas
          </Button>
        </View>
      )}
      <FlatList
        data={items}
        keyExtractor={(n) => String(n.id)}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => !item.isRead && handleMarkAsRead(item.id)}
          />
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        onRefresh={refresh}
        refreshing={loading}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title="Sin notificaciones"
            description="Recibirás alertas cuando te hagan una puja o confirmen una venta"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  markAllRow: { alignItems: "flex-end", paddingHorizontal: 16, paddingVertical: 4 },
  separator: { height: 1, backgroundColor: palette.border, marginLeft: 72 },
});
