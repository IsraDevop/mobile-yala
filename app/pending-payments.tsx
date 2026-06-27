import { FlatList, Linking, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useFetch } from "../src/hooks/useFetch";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { CountdownTimer } from "../src/components/CountdownTimer";
import { Loader } from "../src/components/Loader";
import { ErrorView } from "../src/components/ErrorView";
import { EmptyState } from "../src/components/EmptyState";
import { useToast } from "../src/context/ToastContext";
import { paymentService } from "../src/services/paymentService";
import { getApiErrorMessage } from "../src/utils/apiError";
import type { Order, PageResponse } from "../src/types";
import { palette, fonts } from "../src/theme/theme";

export default function PendingPaymentsScreen() {
  const { showToast } = useToast();
  const { data, loading, error, refetch } =
    useFetch<PageResponse<Order>>("/orders/pending-payment?page=0&size=20");
  const orders = data?.content ?? [];

  const pay = async (orderId: number) => {
    try {
      const pref = await paymentService.createPreference({ orderId });
      Linking.openURL(pref.initPoint);
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Pendientes de pago" />
      {error ? (
        <ErrorView message={error} onRetry={refetch} />
      ) : loading ? (
        <Loader />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => String(o.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.top}>
                <Text numberOfLines={1} style={styles.title}>
                  {item.itemTitle || item.listing?.title || `Orden #${item.id}`}
                </Text>
                <Text style={styles.amount}>S/. {item.amount}</Text>
              </View>
              {item.paymentDeadline ? (
                <View style={styles.deadlineRow}>
                  <Text style={styles.deadlineLabel}>Paga antes de:</Text>
                  <CountdownTimer endsAt={item.paymentDeadline} variant="light" />
                </View>
              ) : null}
              <PrimaryButton label="Pagar ahora" onPress={() => pay(item.id)} />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="wallet-outline"
              title="Nada pendiente"
              description="Cuando ganes una subasta de un live, vas a tener 48 horas para pagarla aquí."
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
  list: { padding: 18, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.borderLight,
    gap: 12,
  },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  title: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: palette.textPrimary },
  amount: { fontFamily: fonts.monoExtra, fontSize: 16, color: palette.primary },
  deadlineRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  deadlineLabel: { fontFamily: fonts.semibold, fontSize: 12, color: palette.secondary },
});
