import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePaginatedFetch } from "../../src/hooks/usePaginatedFetch";
import { useAuth } from "../../src/context/AuthContext";
import { LiveCard } from "../../src/components/LiveCard";
import { Loader } from "../../src/components/Loader";
import { ErrorView } from "../../src/components/ErrorView";
import { EmptyState } from "../../src/components/EmptyState";
import type { LiveSummary } from "../../src/types";
import { palette, fonts } from "../../src/theme/theme";

// "Live" tab: lists only the live streams happening right now.
export default function LiveScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isSeller =
    user?.role === "SELLER" || user?.role === "ADMIN" || !!user?.isVerifiedSeller;
  const { items, loading, error, loadMore, refresh, loadingMore } =
    usePaginatedFetch<LiveSummary>("/live");

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Live</Text>
      </View>

      {isSeller && (
        <Pressable style={styles.goLive} onPress={() => router.push("/seller/go-live")}>
          <Ionicons name="radio" size={18} color="#fff" />
          <Text style={styles.goLiveText}>Salir en vivo</Text>
        </Pressable>
      )}

      {error ? (
        <ErrorView message={error} onRetry={refresh} />
      ) : loading && items.length === 0 ? (
        <Loader />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(l) => String(l.id)}
          renderItem={({ item }) => (
            <LiveCard live={item} onPress={() => router.push(`/live/${item.id}`)} />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl refreshing={loadingMore} onRefresh={refresh} tintColor={palette.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="radio-outline"
              title="No hay transmisiones en vivo"
              description="Cuando un vendedor inicie una transmisión, aparecerá aquí."
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
  header: { backgroundColor: "#fff", paddingHorizontal: 20, paddingBottom: 14 },
  title: { fontFamily: fonts.extrabold, fontSize: 20, color: palette.textPrimary },
  goLive: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginHorizontal: 18, marginTop: 14, height: 50, borderRadius: 16, backgroundColor: palette.secondary,
  },
  goLiveText: { fontFamily: fonts.extrabold, fontSize: 15, color: "#fff" },
  list: { padding: 18, paddingBottom: 24 },
  sep: { height: 14 },
});
