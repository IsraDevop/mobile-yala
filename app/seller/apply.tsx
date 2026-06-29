import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useAuth } from "../../src/context/AuthContext";
import { useToast } from "../../src/context/ToastContext";
import { useForm } from "../../src/hooks/useForm";
import { sellerService } from "../../src/services/sellerService";
import { getApiErrorMessage } from "../../src/utils/apiError";
import { isValidName } from "../../src/utils/validators";
import { Field } from "../../src/components/Field";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { palette, fonts } from "../../src/theme/theme";
import type { SellerApplication } from "../../src/types";

export default function SellerApplyScreen() {
  const { user, refreshSession } = useAuth();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [existingApp, setExistingApp] = useState<SellerApplication | null>(null);

  const form = useForm({
    storeName: "",
    address: "",
    phone: "",
    cci: "",
  });

  useEffect(() => {
    sellerService.getMyApplication()
      .then(setExistingApp)
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshSession();
    }, [refreshSession])
  );

  useEffect(() => {
    if (user?.isVerifiedSeller) {
      router.replace("/(tabs)/profile");
    }
  }, [user?.isVerifiedSeller]);

  async function handleApply() {
    const { storeName, address, phone, cci } = form.values;
    let valid = true;
    if (!isValidName(storeName)) { form.setError("storeName", "Mínimo 2 caracteres"); valid = false; }
    if (phone.trim().length < 7) { form.setError("phone", "Celular inválido"); valid = false; }
    if (cci.replace(/\D/g, "").length < 13) { form.setError("cci", "CCI inválido (mínimo 13 dígitos)"); valid = false; }
    if (!valid) return;

    try {
      setSubmitting(true);
      const result = await sellerService.apply({
        storeName: storeName.trim(),
        address: address.trim() || undefined,
        phone: phone.trim(),
        cci: cci.replace(/\D/g, ""),
      });
      if (result.diditUrl) {
        await Linking.openURL(result.diditUrl);
      } else {
        showToast("Solicitud enviada. Te avisaremos cuando sea aprobada.", "success");
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenHeader title="Conviértete en vendedor" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {existingApp?.status === "PENDING" && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              Ya tienes una solicitud pendiente. Completa el proceso de verificación para activar tu cuenta de vendedor.
            </Text>
            {existingApp.diditUrl ? (
              <PrimaryButton
                label="Continuar verificación"
                onPress={() => Linking.openURL(existingApp.diditUrl!)}
              />
            ) : null}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos de tu tienda</Text>
          <Field
            label="Nombre de la tienda"
            placeholder="Ej. Cartas Pokémon Peru"
            value={form.values.storeName}
            onChangeText={(t) => form.setValue("storeName", t)}
            error={form.errors.storeName}
          />
          <Field
            label="Dirección (opcional)"
            placeholder="Jr. Lima 123, San Isidro"
            value={form.values.address}
            onChangeText={(t) => form.setValue("address", t)}
            error={form.errors.address}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos de contacto y cobro</Text>
          <Field
            label="Celular / WhatsApp"
            placeholder="987654321"
            value={form.values.phone}
            onChangeText={(t) => form.setValue("phone", t)}
            error={form.errors.phone}
            keyboardType="phone-pad"
          />
          <Field
            label="CCI (cuenta interbancaria)"
            placeholder="00219999..."
            value={form.values.cci}
            onChangeText={(t) => form.setValue("cci", t.replace(/\D/g, ""))}
            error={form.errors.cci}
            keyboardType="number-pad"
          />
        </View>

        <Text style={styles.disclaimer}>
          Al enviar, iniciarás el proceso de verificación de identidad con Didit (KYC). Yala revisará tu solicitud y te notificará el resultado.
        </Text>

        <View style={styles.btn}>
          <PrimaryButton label="Enviar solicitud" onPress={handleApply} loading={submitting} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  content: { padding: 18, paddingBottom: 36 },
  banner: {
    backgroundColor: "#FFF7E6",
    borderWidth: 1,
    borderColor: "#F2B95E",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  bannerText: { fontFamily: fonts.medium, fontSize: 13, color: "#7A4F00", lineHeight: 18 },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: palette.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  disclaimer: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: palette.textTertiary,
    lineHeight: 17,
    marginBottom: 18,
  },
  btn: { marginTop: 4 },
});
