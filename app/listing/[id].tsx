import { useState } from "react";
import { FlatList, Image, ScrollView, StyleSheet, View } from "react-native";
import { Avatar, Button, Chip, Dialog, Divider, Portal, Text } from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { useFetch } from "../../src/hooks/useFetch";
import { PriceText } from "../../src/components/PriceText";
import { Loader } from "../../src/components/Loader";
import { ErrorView } from "../../src/components/ErrorView";
import { RatingStars } from "../../src/components/RatingStars";
import { useAuth } from "../../src/context/AuthContext";
import { useToast } from "../../src/context/ToastContext";
import { orderService } from "../../src/services/orderService";
import { getApiErrorMessage } from "../../src/utils/apiError";
import { getAvatarInitials, formatDate } from "../../src/utils/formatters";
import type { Listing } from "../../src/types";
import { palette } from "../../src/theme/theme";

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [buying, setBuying] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: listing, loading, error, refetch } = useFetch<Listing>(
    id ? `/listings/${id}` : null
  );

  async function handleBuy() {
    if (!listing) return;
    try {
      setBuying(true);
      const order = await orderService.create({ listingId: listing.id });
      setConfirmDialog(false);
      showToast(`¡Orden #${order.id} creada! Ve a tus órdenes para ver el estado.`, "success");
      router.push("/(tabs)/orders");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setBuying(false);
    }
  }

  if (loading) return <Loader />;
  if (error || !listing) return <ErrorView message={error ?? "No encontrado"} onRetry={refetch} />;

  const isFixed = listing.mode === "FIXED";
  const isOwner = user?.id === listing.seller.id;

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      {listing.imageUrls.length > 0 && (
        <>
          <Image
            source={{ uri: listing.imageUrls[currentImageIndex] }}
            style={styles.image}
          />
          {listing.imageUrls.length > 1 && (
            <FlatList
              horizontal
              data={listing.imageUrls}
              keyExtractor={(url, i) => `${url}-${i}`}
              renderItem={({ item, index }) => (
                <Button
                  onPress={() => setCurrentImageIndex(index)}
                  style={[
                    styles.thumbBtn,
                    index === currentImageIndex && styles.thumbBtnActive,
                  ]}
                >
                  <Image source={{ uri: item }} style={styles.thumb} />
                </Button>
              )}
              contentContainerStyle={styles.thumbRow}
              showsHorizontalScrollIndicator={false}
            />
          )}
        </>
      )}

      <View style={styles.content}>
        <View style={styles.headerRow}>
          {listing.category && (
            <Chip compact style={styles.catChip} textStyle={styles.catChipText}>
              {listing.category.name}
            </Chip>
          )}
          <Chip compact style={styles.condChip} textStyle={styles.condChipText}>
            {listing.condition}
          </Chip>
        </View>

        <Text variant="headlineSmall" style={styles.title}>{listing.title}</Text>

        {isFixed && listing.fixedPrice != null ? (
          <PriceText amount={listing.fixedPrice} size="large" />
        ) : listing.auction ? (
          <PriceText amount={listing.auction.currentPrice} label="PUJA ACTUAL" size="large" />
        ) : null}

        <Text variant="labelSmall" style={styles.date}>
          Publicado el {formatDate(listing.createdAt)}
        </Text>

        {!isOwner && listing.status === "ACTIVE" && (
          <View style={styles.ctaRow}>
            {isFixed ? (
              <Button
                mode="contained"
                onPress={() => {
                  if (!user) { router.push("/(auth)/login"); return; }
                  setConfirmDialog(true);
                }}
                style={styles.buyBtn}
                contentStyle={styles.buyBtnContent}
                icon="cart"
              >
                Comprar ahora
              </Button>
            ) : listing.auction ? (
              <Button
                mode="contained"
                onPress={() => router.push(`/auction/${listing.auction!.id}`)}
                style={styles.auctionBtn}
                contentStyle={styles.buyBtnContent}
                icon="lightning-bolt"
              >
                Ver subasta y pujar
              </Button>
            ) : null}
          </View>
        )}

        <Divider style={styles.divider} />

        <View style={styles.sellerRow}>
          <Avatar.Text
            size={44}
            label={getAvatarInitials(listing.seller.name)}
            style={{ backgroundColor: palette.primary }}
          />
          <View style={styles.sellerInfo}>
            <Text variant="bodyLarge" style={styles.sellerName}>
              {listing.seller.name}
            </Text>
            <RatingStars rating={listing.seller.reputation} size={14} />
          </View>
          <Button
            compact
            mode="outlined"
            onPress={() => router.push(`/seller/${listing.seller.id}`)}
          >
            Ver perfil
          </Button>
        </View>

        {listing.description && (
          <>
            <Divider style={styles.divider} />
            <Text variant="titleMedium" style={styles.descTitle}>Descripción</Text>
            <Text variant="bodyMedium" style={styles.description}>
              {listing.description}
            </Text>
          </>
        )}
      </View>

      <Portal>
        <Dialog visible={confirmDialog} onDismiss={() => setConfirmDialog(false)}>
          <Dialog.Title>Confirmar compra</Dialog.Title>
          <Dialog.Content>
            <Text>
              ¿Querés comprar "{listing.title}" por{" "}
              <Text style={{ color: palette.secondary, fontWeight: "700" }}>
                S/. {listing.fixedPrice?.toFixed(2)}
              </Text>?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDialog(false)}>Cancelar</Button>
            <Button
              onPress={handleBuy}
              loading={buying}
              disabled={buying}
              textColor={palette.primary}
            >
              Confirmar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  container: { paddingBottom: 40 },
  image: { width: "100%", height: 300, resizeMode: "cover" },
  thumbRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  thumbBtn: { padding: 0 },
  thumbBtnActive: { borderWidth: 2, borderColor: palette.primary, borderRadius: 8 },
  thumb: { width: 56, height: 56, borderRadius: 6 },
  content: { padding: 16 },
  headerRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  catChip: { backgroundColor: palette.primary + "20" },
  catChipText: { color: palette.primary, fontSize: 11 },
  condChip: { backgroundColor: palette.secondary + "20" },
  condChipText: { color: palette.secondary, fontSize: 11 },
  title: { fontWeight: "900", color: palette.textPrimary, marginBottom: 8 },
  date: { color: palette.textSecondary, marginTop: 4, marginBottom: 16 },
  ctaRow: { marginVertical: 8 },
  buyBtn: { backgroundColor: palette.secondary },
  auctionBtn: { backgroundColor: palette.primary },
  buyBtnContent: { paddingVertical: 6 },
  divider: { marginVertical: 16 },
  sellerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  sellerInfo: { flex: 1 },
  sellerName: { fontWeight: "700", color: palette.textPrimary },
  descTitle: { fontWeight: "700", color: palette.textPrimary, marginBottom: 8 },
  description: { color: palette.textPrimary, lineHeight: 22 },
});
