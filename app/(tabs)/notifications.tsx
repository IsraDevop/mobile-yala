import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePaginatedFetch } from "../../src/hooks/usePaginatedFetch";
import { NotificationItem } from "../../src/components/NotificationItem";
import { Loader } from "../../src/components/Loader";
import { EmptyState } from "../../src/components/EmptyState";
import { ErrorView } from "../../src/components/ErrorView";
import { useToast } from "../../src/context/ToastContext";
import { notificationService } from "../../src/services/notificationService";
import { getApiErrorMessage } from "../../src/utils/apiError";
import type { Notification } from "../../src/types";
import { palette, fonts } from "../../src/theme/theme";

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
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
      showToast("Todo marcado como leído", "success");
      refresh();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  const hasUnread = items.some((n) => !n.isRead);

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Notificaciones</Text>
        {hasUnread && (
          <Pressable onPress={handleMarkAllRead} hitSlop={8}>
            <Text style={styles.markAll}>Marcar todas</Text>
          </Pressable>
        )}
      </View>

      {error ? (
        <ErrorView message={error} onRetry={refresh} />
      ) : loading && items.length === 0 ? (
        <Loader />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => String(n.id)}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={() => !item.isRead && handleMarkAsRead(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          onRefresh={refresh}
          refreshing={loading}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-outline"
              title="Sin notificaciones"
              description="Vas a recibir alertas cuando te hagan una puja o confirmen una venta."
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
  header: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  title: { fontFamily: fonts.extrabold, fontSize: 20, color: palette.textPrimary },
  markAll: { fontFamily: fonts.bold, fontSize: 12, color: palette.primary },
  list: { padding: 18, paddingBottom: 24 },
});
