import { useCallback, useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFetch } from "../../src/hooks/useFetch";
import { useDebounce } from "../../src/hooks/useDebounce";
import { useAuth } from "../../src/context/AuthContext";
import { ListingCard } from "../../src/components/ListingCard";
import { SearchBar } from "../../src/components/SearchBar";
import { CategoryTabs } from "../../src/components/CategoryTabs";
import { Logo } from "../../src/components/Logo";
import { Loader } from "../../src/components/Loader";
import { ErrorView } from "../../src/components/ErrorView";
import { EmptyState } from "../../src/components/EmptyState";
import { getAvatarInitials } from "../../src/utils/formatters";
import type { Category, Listing } from "../../src/types";
import { palette, fonts } from "../../src/theme/theme";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const { data: categories } = useFetch<Category[]>("/categories");

  const params = new URLSearchParams({ mode: "AUCTION", page: "0", size: "20" });
  if (debouncedSearch) params.set("q", debouncedSearch);
  if (selectedCategory) {
    const cat = categories?.find((c) => c.id === selectedCategory);
    if (cat) params.set("category", cat.name);
  }

  const { data: auctionsPage, loading, error, refetch } =
    useFetch<{ content: Listing[] }>(`/listings?${params.toString()}`);
  const auctions = auctionsPage?.content ?? [];

  const handleCategorySelect = useCallback((id: number | null) => {
    setSelectedCategory(id);
    setSearch("");
  }, []);

  // Refetch when the tab regains focus so stale auctions don't linger.
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;
  useFocusEffect(useCallback(() => { refetchRef.current(); }, []));

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
      ) : loading && auctions.length === 0 ? (
        <Loader />
      ) : (
        <FlatList
          data={auctions}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          ListHeaderComponent={
            <Text style={styles.feedTitle}>Subastas</Text>
          }
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              hideActiveBadge
              onPress={() =>
                item.auction
                  ? router.push(`/auction/${item.auction.id}`)
                  : router.push(`/listing/${item.id}`)
              }
            />
          )}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.grid}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={palette.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="pricetag-outline"
              title="Sin subastas activas"
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
  feedTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
    color: palette.textPrimary,
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 4,
  },
  column: { paddingHorizontal: 14 },
  grid: { paddingBottom: 24 },
});
