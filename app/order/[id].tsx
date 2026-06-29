import { useState } from "react";
import { Image, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFetch } from "../../src/hooks/useFetch";
import { useAuth } from "../../src/context/AuthContext";
import { useToast } from "../../src/context/ToastContext";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { Loader } from "../../src/components/Loader";
import { ErrorView } from "../../src/components/ErrorView";
import { orderService } from "../../src/services/orderService";
import { paymentService } from "../../src/services/paymentService";
import { getApiErrorMessage } from "../../src/utils/apiError";
import { formatPrice } from "../../src/utils/formatters";
import { palette, fonts } from "../../src/theme/theme";
import type { Order, OrderStatus } from "../../src/types";

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "PENDIENTE DE PAGO",
  CONFIRMED: "CONFIRMADA",
  CANCELLED: "CANCELADA",
};
const STATUS_STYLE: Record<OrderStatus, { bg: string; fg: string }> = {
  PENDING: { bg: palette.warningBg, fg: palette.warning },
  CONFIRMED: { bg: palette.successBg, fg: palette.success },
  CANCELLED: { bg: "#F2F3F6", fg: "#8A8F98" },
};

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [acting, setActing] = useState(false);

  const { data: order, loading, error, refetch } = useFetch<Order>(id ? `/orders/${id}` : null);

  async function handlePay() {
    if (!order) return;
    try {
      setActing(true);
      const pref = await paymentService.createPreference({ orderId: order.id });
      const can = await Linking.canOpenURL(pref.initPoint);
      if (can) await Linking.openURL(pref.initPoint);
      else showToast("No se pudo abrir Mercado Pago", "error");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setActing(false);
    }
  }

  async function handleConfirm() {
    if (!order) return;
    try {
      setActing(true);
      await orderService.confirm(order.id);
      showToast("Orden confirmada", "success");
      refetch();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setActing(false);
    }
  }

  async function handleCancel() {
    if (!order) return;
    try {
      setActing(true);
      await orderService.cancel(order.id);
      showToast("Orden cancelada", "info");
      refetch();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setActing(false);
    }
  }

  if (loading) return (<View style={styles.flex}><ScreenHeader title={`Orden #${id}`} /><Loader /></View>);
  if (error || !order) return (<View style={styles.flex}><ScreenHeader title="Orden" /><ErrorView message={error ?? "No encontrada"} onRetry={refetch} /></View>);

  const s = STATUS_STYLE[order.status];
  const isSeller = order.seller.id === user?.id;
  const isBuyer = order.buyer.id === user?.id;
  const image = order.listing?.imageUrls?.[0];

  return (
    <View style={styles.flex}>
      <ScreenHeader title={`Orden #${order.id}`} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusWrap}>
          <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: s.fg }]} />
            <Text style={[styles.statusText, { color: s.fg }]}>{STATUS_LABEL[order.status]}</Text>
          </View>
        </View>

        <View style={styles.productCard}>
          {image ? (
            <Image source={{ uri: image }} style={styles.productImg} />
          ) : (
            <View style={[styles.productImg, styles.placeholder]}>
              <Text style={styles.placeholderText}>Yala</Text>
            </View>
          )}
          <View style={styles.productInfo}>
            <Text numberOfLines={2} style={styles.productTitle}>{order.listing?.title ?? order.itemTitle ?? `Orden #${order.id}`}</Text>
            <Text style={styles.productSeller}>Vendedor · {order.seller.name}</Text>
          </View>
        </View>

        <View style={styles.totals}>
          <Row label="Subtotal" value={formatPrice(order.amount)} />
          <Row label="Comisión Yala" value={formatPrice(0)} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(order.amount)}</Text>
          </View>
        </View>

        {order.status === "PENDING" && isBuyer && (
          <View style={styles.payMethod}>
            <View style={styles.mpBadge}><Text style={styles.mpText}>MP</Text></View>
            <Text style={styles.payName}>Mercado Pago</Text>
            <Ionicons name="checkmark-circle" size={18} color={palette.primary} />
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 18 }]}>
        {order.status === "PENDING" && isBuyer && (
          <PrimaryButton label="Pagar con Mercado Pago" onPress={handlePay} loading={acting} />
        )}
        {order.status === "PENDING" && isSeller && (
          <PrimaryButton label="Confirmar venta" onPress={handleConfirm} loading={acting} />
        )}
        {order.status === "PENDING" && (
          <Pressable onPress={handleCancel} style={styles.cancel} disabled={acting}>
            <Text style={styles.cancelText}>Cancelar orden</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  content: { padding: 18, paddingBottom: 20 },
  statusWrap: { alignItems: "center", marginVertical: 8 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontFamily: fonts.monoBold, fontSize: 12 },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: palette.borderLight,
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
  },
  productImg: { width: 64, height: 64, borderRadius: 14, backgroundColor: palette.dark },
  placeholder: { justifyContent: "center", alignItems: "center" },
  placeholderText: { color: "#3A3D46", fontSize: 14, fontFamily: fonts.extrabold },
  productInfo: { flex: 1 },
  productTitle: { fontFamily: fonts.bold, fontSize: 14, color: palette.textPrimary, lineHeight: 18 },
  productSeller: { fontFamily: fonts.regular, fontSize: 11, color: palette.textTertiary, marginTop: 3 },
  totals: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: palette.borderLight,
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  rowLabel: { fontFamily: fonts.regular, fontSize: 13, color: "#7C808B" },
  rowValue: { fontFamily: fonts.mono, fontSize: 13, color: palette.textPrimary },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F2F3F6" },
  totalLabel: { fontFamily: fonts.extrabold, fontSize: 15, color: palette.textPrimary },
  totalValue: { fontFamily: fonts.monoExtra, fontSize: 20, color: palette.textPrimary },
  payMethod: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: palette.borderLight,
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
  },
  mpBadge: { width: 40, height: 28, borderRadius: 6, backgroundColor: "#00B1EA", justifyContent: "center", alignItems: "center" },
  mpText: { color: "#fff", fontFamily: fonts.monoBold, fontSize: 9 },
  payName: { flex: 1, fontFamily: fonts.bold, fontSize: 13, color: palette.textPrimary },
  footer: { padding: 18, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: palette.borderLight },
  cancel: { alignItems: "center", marginTop: 12 },
  cancelText: { fontFamily: fonts.bold, fontSize: 13, color: palette.error },
});
