import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePaginatedFetch } from "../../src/hooks/usePaginatedFetch";
import { AuctionCard } from "../../src/components/AuctionCard";
import { Loader } from "../../src/components/Loader";
import { ErrorView } from "../../src/components/ErrorView";
import { EmptyState } from "../../src/components/EmptyState";
import type { Auction } from "../../src/types";
import { palette, fonts } from "../../src/theme/theme";

export default function AuctionsScreen() {
  const insets = useSafeAreaInsets();
  const { items, loading, error, loadMore, refresh, loadingMore } =
    usePaginatedFetch<Auction>("/auctions");

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Subastas en vivo</Text>
      </View>

      {error ? (
        <ErrorView message={error} onRetry={refresh} />
      ) : loading && items.length === 0 ? (
        <Loader />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => String(a.id)}
          renderItem={({ item }) => (
            <AuctionCard auction={item} onPress={() => router.push(`/auction/${item.id}`)} />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl refreshing={loadingMore} onRefresh={refresh} tintColor={palette.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="flash-outline"
              title="No hay subastas activas"
              description="Vuelve pronto para descubrir nuevas subastas en vivo."
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
  list: { padding: 18, paddingBottom: 24 },
  sep: { height: 14 },
});
