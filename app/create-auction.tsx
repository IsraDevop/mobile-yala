import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToast } from "../src/context/ToastContext";
import { useForm } from "../src/hooks/useForm";
import { auctionService } from "../src/services/auctionService";
import { getApiErrorMessage } from "../src/utils/apiError";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { Field } from "../src/components/Field";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { palette, fonts } from "../src/theme/theme";

export default function CreateAuctionScreen() {
  const insets = useSafeAreaInsets();
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm({ startingPrice: "", endsAt: "" });

  async function handleSubmit() {
    const { startingPrice, endsAt } = form.values;
    let valid = true;
    const price = parseFloat(startingPrice);
    if (isNaN(price) || price <= 0) { form.setError("startingPrice", "Precio inicial inválido"); valid = false; }
    const endsDate = new Date(endsAt);
    if (!endsAt || isNaN(endsDate.getTime()) || endsDate <= new Date()) {
      form.setError("endsAt", "Fecha futura: YYYY-MM-DDTHH:mm"); valid = false;
    }
    if (!valid) return;

    try {
      setSubmitting(true);
      const auction = await auctionService.create({
        listingId: Number(listingId),
        startingPrice: price,
        endsAt: new Date(endsAt).toISOString(),
      });
      showToast("¡Subasta creada!", "success");
      router.replace(`/auction/${auction.id}`);
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Configurar subasta" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>Define el precio inicial y cuándo termina tu subasta.</Text>
        <Field
          label="Precio inicial (S/.)"
          placeholder="100"
          value={form.values.startingPrice}
          onChangeText={(t) => form.setValue("startingPrice", t)}
          error={form.errors.startingPrice}
          keyboardType="decimal-pad"
        />
        <Field
          label="Fecha y hora de cierre"
          placeholder="2026-07-01T20:00"
          value={form.values.endsAt}
          onChangeText={(t) => form.setValue("endsAt", t)}
          error={form.errors.endsAt}
          autoCapitalize="none"
        />
        <Text style={styles.hint}>Formato: YYYY-MM-DDTHH:mm</Text>
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={[styles.footer, { paddingBottom: insets.bottom || 18 }]}>
        <PrimaryButton label="Iniciar subasta" icon="flash" onPress={handleSubmit} loading={submitting} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  content: { padding: 22 },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: palette.textSecondary, marginBottom: 20 },
  hint: { fontFamily: fonts.mono, fontSize: 11, color: palette.textTertiary, marginTop: -8 },
  footer: { padding: 18, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: palette.borderLight },
});
