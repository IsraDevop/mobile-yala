import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { useToast } from "../src/context/ToastContext";
import { useForm } from "../src/hooks/useForm";
import { auctionService } from "../src/services/auctionService";
import { getApiErrorMessage } from "../src/utils/apiError";
import { palette } from "../src/theme/theme";

export default function CreateAuctionScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    startingPrice: "",
    endsAt: "",
  });

  async function handleSubmit() {
    const { startingPrice, endsAt } = form.values;
    let valid = true;

    const price = parseFloat(startingPrice);
    if (isNaN(price) || price <= 0) {
      form.setError("startingPrice", "Ingresá un precio inicial válido");
      valid = false;
    }
    if (!endsAt) {
      form.setError("endsAt", "Ingresá la fecha y hora de cierre");
      valid = false;
    }
    const endsDate = new Date(endsAt);
    if (isNaN(endsDate.getTime()) || endsDate <= new Date()) {
      form.setError("endsAt", "La fecha debe ser futura (formato: YYYY-MM-DDTHH:mm)");
      valid = false;
    }
    if (!valid) return;

    try {
      setSubmitting(true);
      const auction = await auctionService.create({
        listingId: Number(listingId),
        startingPrice: price,
        endsAt: new Date(endsAt).toISOString(),
      });
      showToast("¡Subasta creada con éxito!", "success");
      router.replace(`/auction/${auction.id}`);
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text variant="titleLarge" style={styles.title}>Configurar subasta</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Definí el precio inicial y cuándo termina tu subasta.
      </Text>

      <TextInput
        label="Precio inicial (S/.) *"
        value={form.values.startingPrice}
        onChangeText={(t) => form.setValue("startingPrice", t)}
        error={!!form.errors.startingPrice}
        keyboardType="decimal-pad"
        mode="outlined"
        style={styles.input}
        left={<TextInput.Affix text="S/." />}
      />
      {form.errors.startingPrice && (
        <Text style={styles.fieldError}>{form.errors.startingPrice}</Text>
      )}

      <TextInput
        label="Fecha y hora de cierre *"
        value={form.values.endsAt}
        onChangeText={(t) => form.setValue("endsAt", t)}
        error={!!form.errors.endsAt}
        mode="outlined"
        placeholder="2026-07-01T20:00"
        style={styles.input}
      />
      <Text variant="labelSmall" style={styles.hint}>
        Formato: YYYY-MM-DDTHH:mm (ej: 2026-07-01T20:00)
      </Text>
      {form.errors.endsAt && (
        <Text style={styles.fieldError}>{form.errors.endsAt}</Text>
      )}

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting}
        style={styles.btn}
        contentStyle={styles.btnContent}
        icon="lightning-bolt"
      >
        Iniciar subasta
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  container: { padding: 24 },
  title: { fontWeight: "900", color: palette.textPrimary, marginBottom: 8 },
  subtitle: { color: palette.textSecondary, marginBottom: 24 },
  input: { marginBottom: 4 },
  hint: { color: palette.textSecondary, marginBottom: 8 },
  fieldError: { color: palette.error, fontSize: 12, marginBottom: 4 },
  btn: { marginTop: 24, backgroundColor: palette.primary },
  btnContent: { paddingVertical: 6 },
});
