import { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { router } from "expo-router";
import { useFetch } from "../../src/hooks/useFetch";
import { usePaginatedFetch } from "../../src/hooks/usePaginatedFetch";
import { useDebounce } from "../../src/hooks/useDebounce";
import { AuctionCard } from "../../src/components/AuctionCard";
import { ListingCard } from "../../src/components/ListingCard";
import { SearchBar } from "../../src/components/SearchBar";
import { CategoryTabs } from "../../src/components/CategoryTabs";
import { Loader } from "../../src/components/Loader";
import { ErrorView } from "../../src/components/ErrorView";
import { EmptyState } from "../../src/components/EmptyState";
import type { Category, Auction, Listing } from "../../src/types";
import { palette } from "../../src/theme/theme";

export default function HomeScreen() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const { data: categories } = useFetch<Category[]>("/categories");

  const { data: auctionsPage } = useFetch<{ content: Auction[] }>("/auctions?page=0&size=5");
  const auctions = auctionsPage?.content ?? [];

  const listingParams = new URLSearchParams({ page: "0", size: "20" });
  if (debouncedSearch) listingParams.set("q", debouncedSearch);
  if (selectedCategory) {
    const cat = categories?.find((c) => c.id === selectedCategory);
    if (cat) listingParams.set("category", cat.name);
  }

  const { data: listingsPage, loading: loadingListings, error: listingsError, refetch: refetchListings } =
    useFetch<{ content: Listing[] }>(`/listings?${listingParams.toString()}`);
  const listings = listingsPage?.content ?? [];

  const handleCategorySelect = useCallback((id: number | null) => {
    setSelectedCategory(id);
    setSearch("");
  }, []);

  const ListHeader = (
    <>
      <SearchBar value={search} onChangeText={setSearch} />
      <CategoryTabs
        categories={categories ?? []}
        selected={selectedCategory}
        onSelect={handleCategorySelect}
      />
      {auctions.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <View style={styles.liveIndicator} />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Subastas en vivo
            </Text>
            <Text variant="labelSmall" style={styles.sectionCount}>
              {auctions.length} activa{auctions.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <FlatList
            horizontal
            data={auctions}
            keyExtractor={(a) => String(a.id)}
            renderItem={({ item }) => (
              <View style={styles.auctionCardWrapper}>
                <AuctionCard
                  auction={item}
                  onPress={() => router.push(`/auction/${item.id}`)}
                />
              </View>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.auctionList}
          />
        </>
      )}
      <Text variant="titleMedium" style={styles.listingsTitle}>
        Publicaciones
      </Text>
    </>
  );

  if (listingsError) {
    return <ErrorView message={listingsError} onRetry={refetchListings} />;
  }

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.brand}>
          <Text style={styles.brandAccent}>Y</Text>ala
        </Text>
      </View>

      {loadingListings && listings.length === 0 ? (
        <>
          {ListHeader}
          <Loader />
        </>
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
          contentContainerStyle={styles.grid}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="Sin resultados"
              description="Intenta con otro término o cambia los filtros"
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
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  brand: { fontWeight: "900", color: palette.textPrimary },
  brandAccent: { color: palette.primary },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    gap: 8,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  sectionTitle: { fontWeight: "700", color: palette.textPrimary, flex: 1 },
  sectionCount: { color: palette.textSecondary },
  auctionList: { paddingHorizontal: 10 },
  auctionCardWrapper: { width: 220 },
  listingsTitle: {
    fontWeight: "700",
    color: palette.textPrimary,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
  },
  grid: { paddingHorizontal: 10, paddingBottom: 20 },
});
