import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Dialog, Portal, Text } from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFetch } from "../../src/hooks/useFetch";
import { useAuth } from "../../src/context/AuthContext";
import { useToast } from "../../src/context/ToastContext";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { RatingStars } from "../../src/components/RatingStars";
import { Loader } from "../../src/components/Loader";
import { ErrorView } from "../../src/components/ErrorView";
import { orderService } from "../../src/services/orderService";
import { getApiErrorMessage } from "../../src/utils/apiError";
import { getAvatarInitials, formatPrice } from "../../src/utils/formatters";
import type { Listing } from "../../src/types";
import { palette, fonts } from "../../src/theme/theme";

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [confirm, setConfirm] = useState(false);
  const [buying, setBuying] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  const { data: listing, loading, error, refetch } = useFetch<Listing>(id ? `/listings/${id}` : null);

  async function handleBuy() {
    if (!listing) return;
    try {
      setBuying(true);
      const order = await orderService.create({ listingId: listing.id });
      setConfirm(false);
      showToast(`¡Orden #${order.id} creada!`, "success");
      router.push(`/order/${order.id}`);
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setBuying(false);
    }
  }

  if (loading) return (<View style={styles.flex}><ScreenHeader title="Volver" /><Loader /></View>);
  if (error || !listing) return (<View style={styles.flex}><ScreenHeader title="Volver" /><ErrorView message={error ?? "No encontrado"} onRetry={refetch} /></View>);

  const isOwner = user?.id === listing.seller.id;
  const images = listing.imageUrls ?? [];

  return (
    <View style={styles.flex}>
      <ScreenHeader
        title="Volver"
        right={
          <Pressable hitSlop={8}>
            <Ionicons name="heart-outline" size={22} color="#3A3D46" />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {images.length > 0 ? (
          <Image source={{ uri: images[imgIndex] }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>imagen del producto</Text>
          </View>
        )}
        {images.length > 1 && (
          <View style={styles.thumbs}>
            {images.map((uri, i) => (
              <Pressable key={i} onPress={() => setImgIndex(i)}>
                <Image source={{ uri }} style={[styles.thumb, i === imgIndex && styles.thumbActive]} />
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.body}>
          <Text style={styles.breadcrumb}>
            {listing.category?.name?.toUpperCase()} · {listing.condition?.toUpperCase()}
          </Text>
          <Text style={styles.title}>{listing.title}</Text>
          {listing.fixedPrice != null && (
            <Text style={styles.price}>{formatPrice(listing.fixedPrice)}</Text>
          )}
          {listing.description ? <Text style={styles.description}>{listing.description}</Text> : null}

          <Pressable style={styles.sellerCard} onPress={() => router.push(`/seller/${listing.seller.id}`)}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>{getAvatarInitials(listing.seller.name)}</Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{listing.seller.name}</Text>
              <RatingStars rating={listing.seller.reputation} size={12} starColor={palette.star} textColor={palette.star} />
            </View>
            <Text style={styles.sellerLink}>Ver perfil ›</Text>
          </Pressable>
        </View>
      </ScrollView>

      {!isOwner && listing.status === "ACTIVE" && (
        <View style={styles.footer}>
          <Pressable style={styles.cartBtn} onPress={() => (user ? setConfirm(true) : router.push("/(auth)/login"))}>
            <Ionicons name="cart-outline" size={22} color={palette.primary} />
          </Pressable>
          <View style={styles.buyBtn}>
            <PrimaryButton
              label="Comprar ahora"
              onPress={() => (user ? setConfirm(true) : router.push("/(auth)/login"))}
            />
          </View>
        </View>
      )}

      <Portal>
        <Dialog visible={confirm} onDismiss={() => setConfirm(false)} style={styles.dialog}>
          <Dialog.Title>Confirmar compra</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              ¿Comprar "{listing.title}" por {formatPrice(listing.fixedPrice ?? 0)}?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirm(false)} textColor={palette.textSecondary}>Cancelar</Button>
            <Button onPress={handleBuy} loading={buying} disabled={buying} textColor={palette.primary}>
              Confirmar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  content: { paddingBottom: 24 },
  image: { height: 300, marginHorizontal: 18, borderRadius: 22, backgroundColor: palette.dark },
  placeholder: { justifyContent: "center", alignItems: "center" },
  placeholderText: { fontFamily: fonts.mono, fontSize: 12, color: "#9DA2AE" },
  thumbs: { flexDirection: "row", gap: 7, paddingHorizontal: 18, paddingTop: 10 },
  thumb: { width: 46, height: 46, borderRadius: 11, backgroundColor: palette.dark },
  thumbActive: { borderWidth: 2, borderColor: palette.primary },
  body: { padding: 18 },
  breadcrumb: { fontFamily: fonts.monoBold, fontSize: 10, color: palette.primary, letterSpacing: 0.6 },
  title: { fontFamily: fonts.extrabold, fontSize: 21, color: palette.textPrimary, lineHeight: 26, marginTop: 6 },
  price: { fontFamily: fonts.monoExtra, fontSize: 28, color: palette.textPrimary, marginTop: 12 },
  description: { fontFamily: fonts.regular, fontSize: 13, color: "#7C808B", lineHeight: 20, marginTop: 10 },
  sellerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.borderLight,
  },
  sellerAvatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: palette.avatarBg,
    justifyContent: "center", alignItems: "center",
  },
  sellerAvatarText: { color: palette.primary, fontFamily: fonts.extrabold, fontSize: 14 },
  sellerInfo: { flex: 1 },
  sellerName: { fontFamily: fonts.bold, fontSize: 14, color: palette.textPrimary },
  sellerLink: { fontFamily: fonts.bold, fontSize: 12, color: palette.primary },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: palette.borderLight,
  },
  cartBtn: {
    width: 54, height: 54, borderRadius: 16, backgroundColor: palette.primaryContainer,
    justifyContent: "center", alignItems: "center",
  },
  buyBtn: { flex: 1 },
  dialog: { backgroundColor: "#fff", borderRadius: 20 },
  dialogText: { fontFamily: fonts.regular, color: palette.textPrimary },
});
