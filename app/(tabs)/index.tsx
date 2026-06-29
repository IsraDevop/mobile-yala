import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFetch } from "../../src/hooks/useFetch";
import { useDebounce } from "../../src/hooks/useDebounce";
import { useAuth } from "../../src/context/AuthContext";
import { AuctionCard } from "../../src/components/AuctionCard";
import { LiveCard } from "../../src/components/LiveCard";
import { ListingCard } from "../../src/components/ListingCard";
import { SearchBar } from "../../src/components/SearchBar";
import { CategoryTabs } from "../../src/components/CategoryTabs";
import { Logo } from "../../src/components/Logo";
import { Loader } from "../../src/components/Loader";
import { ErrorView } from "../../src/components/ErrorView";
import { EmptyState } from "../../src/components/EmptyState";
import { getAvatarInitials } from "../../src/utils/formatters";
import type { Category, Auction, Listing, LiveSummary } from "../../src/types";
import { palette, fonts } from "../../src/theme/theme";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const { data: categories } = useFetch<Category[]>("/categories");
  const { data: auctionsPage, refetch: refetchAuctions } = useFetch<{ content: Auction[] }>("/auctions?page=0&size=10");
  const auctions = auctionsPage?.content ?? [];
  const { data: livesPage, refetch: refetchLives } = useFetch<{ content: LiveSummary[] }>("/live?page=0&size=12");
  const lives = livesPage?.content ?? [];

  const listingParams = new URLSearchParams({ page: "0", size: "20" });
  if (debouncedSearch) listingParams.set("q", debouncedSearch);
  if (selectedCategory) {
    const cat = categories?.find((c) => c.id === selectedCategory);
    if (cat) listingParams.set("category", cat.name);
  }

  const { data: listingsPage, loading, error, refetch } =
    useFetch<{ content: Listing[] }>(`/listings?${listingParams.toString()}`);
  const listings = listingsPage?.content ?? [];

  const handleCategorySelect = useCallback((id: number | null) => {
    setSelectedCategory(id);
    setSearch("");
  }, []);

  const onRefresh = useCallback(() => {
    refetch();
    refetchAuctions();
    refetchLives();
  }, [refetch, refetchAuctions, refetchLives]);

  const ListHeader = (
    <View>
      {lives.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.sectionTitle}>En vivo ahora</Text>
            </View>
            <Text style={styles.sectionCount}>
              {lives.length} transmisi{lives.length !== 1 ? "ones" : "ón"}
            </Text>
          </View>
          <FlatList
            horizontal
            data={lives}
            keyExtractor={(l) => `live-${l.id}`}
            renderItem={({ item }) => (
              <LiveCard live={item} onPress={() => router.push(`/live/${item.id}`)} />
            )}
            contentContainerStyle={styles.livesRow}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}
      {auctions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.sectionTitle}>Subastas en vivo</Text>
            </View>
            <Text style={styles.sectionCount}>
              {auctions.length} activa{auctions.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.auctionList}>
            {auctions.map((a) => (
              <AuctionCard key={a.id} auction={a} onPress={() => router.push(`/auction/${a.id}`)} />
            ))}
          </View>
        </View>
      )}
      <Text style={styles.listingsTitle}>Publicaciones</Text>
    </View>
  );

  return (
    <View style={styles.flex}>
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <View style={styles.topRow}>
          <Logo size={22} />
          <View style={styles.topActions}>
            <Pressable onPress={() => router.push("/(tabs)/notifications")} hitSlop={8}>
              <Ionicons name="notifications-outline" size={22} color="#3A3D46" />
            </Pressable>
            <Pressable onPress={() => router.push("/(tabs)/profile")}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user ? getAvatarInitials(user.name) : "?"}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
        <SearchBar value={search} onChangeText={setSearch} />
        <View style={styles.categories}>
          <CategoryTabs
            categories={categories ?? []}
            selected={selectedCategory}
            onSelect={handleCategorySelect}
          />
        </View>
      </View>

      {error ? (
        <ErrorView message={error} onRetry={refetch} />
      ) : loading && listings.length === 0 ? (
        <Loader />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          ListHeaderComponent={ListHeader}
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              onPress={() =>
                item.mode === "AUCTION" && item.auction
                  ? router.push(`/auction/${item.auction.id}`)
                  : router.push(`/listing/${item.id}`)
              }
            />
          )}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.grid}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={palette.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="Sin resultados"
              description="Prueba con otro término o cambia los filtros."
              ctaLabel="Limpiar búsqueda"
              onCta={() => { setSearch(""); setSelectedCategory(null); }}
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
  topBar: { backgroundColor: "#fff", paddingHorizontal: 20, paddingBottom: 12 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: palette.avatarBg,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: palette.primary, fontFamily: fonts.extrabold, fontSize: 13 },
  categories: { marginTop: 14, marginHorizontal: -20, paddingHorizontal: 20 },
  section: { marginTop: 16 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.secondary },
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: palette.textPrimary },
  sectionCount: { fontFamily: fonts.mono, fontSize: 11, color: palette.textTertiary },
  auctionList: { paddingHorizontal: 20, gap: 14 },
  livesRow: { paddingHorizontal: 20, gap: 14 },
  listingsTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
    color: palette.textPrimary,
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 4,
  },
  column: { paddingHorizontal: 14 },
  grid: { paddingBottom: 24 },
});
