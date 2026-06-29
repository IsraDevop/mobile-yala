import { useState } from "react";
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { useToast } from "../../src/context/ToastContext";
import { useForm } from "../../src/hooks/useForm";
import { useFetch } from "../../src/hooks/useFetch";
import { listingService } from "../../src/services/listingService";
import { getApiErrorMessage } from "../../src/utils/apiError";
import { pickImageFromGallery } from "../../src/utils/imageUtils";
import { Field } from "../../src/components/Field";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { EmptyState } from "../../src/components/EmptyState";
import type { Category } from "../../src/types";
import { palette, fonts } from "../../src/theme/theme";

const CONDITIONS = ["Sellado", "Como nuevo", "Con desgaste"];

export default function SellScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [conditionOpen, setConditionOpen] = useState(false);

  const { data: categories } = useFetch<Category[]>("/categories");

  const form = useForm({
    title: "",
    description: "",
    mode: "AUCTION" as "FIXED" | "AUCTION",
    fixedPrice: "",
    condition: "",
    categoryId: 0,
  });

  if (user?.role !== "SELLER" && user?.role !== "ADMIN") {
    return (
      <View style={[styles.flex, { paddingTop: insets.top }]}>
        <EmptyState
          icon="lock-closed-outline"
          title="Solo vendedores"
          description="Para publicar coleccionables necesitas una cuenta de vendedor."
          ctaLabel="Conviértete en vendedor"
          onCta={() => router.push("/seller/apply")}
        />
      </View>
    );
  }

  async function pickImage() {
    if (photos.length >= 5) { showToast("Máximo 5 imágenes", "error"); return; }
    const uri = await pickImageFromGallery();
    if (uri) setPhotos((p) => [...p, uri]);
  }

  async function handleSubmit() {
    const { title, description, condition, categoryId } = form.values;
    let valid = true;
    if (!title.trim()) { form.setError("title", "El título es obligatorio"); valid = false; }
    if (!condition.trim()) { form.setError("condition", "La condición es obligatoria"); valid = false; }
    if (categoryId === 0) { form.setError("categoryId", "Selecciona una categoría"); valid = false; }
    if (!valid) return;

    try {
      setSubmitting(true);
      const listing = await listingService.create({
        title: title.trim(),
        description: description.trim(),
        mode: "AUCTION",
        condition: condition.trim(),
        categoryId,
      });

      if (photos.length > 0) {
        await Promise.all(
          photos.map((uri, i) =>
            listingService.uploadImage(listing.id, { uri, name: `photo_${i}.jpg`, type: "image/jpeg" }, i)
          )
        );
      }

      showToast("¡Publicación creada!", "success");
      router.push(`/create-auction?listingId=${listing.id}`);
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  const isAuction = form.values.mode === "AUCTION";

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.headerLeft} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={22} color="#3A3D46" />
          <Text style={styles.headerTitle}>Nueva publicación</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.photosRow}>
          <Pressable style={styles.addPhoto} onPress={pickImage}>
            <Ionicons name="add" size={22} color={palette.primary} />
          </Pressable>
          <Pressable style={styles.cameraPhoto} onPress={() => router.push("/camera")}>
            <Ionicons name="camera-outline" size={22} color="#9499A3" />
          </Pressable>
          {photos.map((uri, i) => (
            <Pressable key={i} onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}>
              <Image source={{ uri }} style={styles.photo} />
              <View style={styles.photoIndex}>
                <Text style={styles.photoIndexText}>{i + 1}/5</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <Field
          label="Título"
          placeholder="Charizard PSA 9 — 1ª edición"
          value={form.values.title}
          onChangeText={(t) => form.setValue("title", t)}
          error={form.errors.title}
        />
        <Field
          label="Descripción"
          placeholder="Detalles del coleccionable…"
          value={form.values.description}
          onChangeText={(t) => form.setValue("description", t)}
          multiline
        />
        <Text style={styles.label}>Condición</Text>
        <Pressable
          style={[styles.select, form.errors.condition ? styles.selectError : null]}
          onPress={() => setConditionOpen(true)}
        >
          <Text style={form.values.condition ? styles.selectValue : styles.selectPlaceholder}>
            {form.values.condition || "Elige la condición"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#9499A3" />
        </Pressable>
        {form.errors.condition ? <Text style={styles.fieldError}>{form.errors.condition}</Text> : null}

        <Text style={styles.label}>Categoría</Text>
        <View style={styles.pills}>
          {(categories ?? []).map((cat) => {
            const active = form.values.categoryId === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => form.setValue("categoryId", cat.id)}
                style={[styles.pill, active ? styles.pillOn : styles.pillOff]}
              >
                <Text style={active ? styles.pillOnText : styles.pillOffText}>{cat.name}</Text>
              </Pressable>
            );
          })}
        </View>
        {form.errors.categoryId ? <Text style={styles.fieldError}>{form.errors.categoryId}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 18 }]}>
        <PrimaryButton
          label={isAuction ? "Crear y configurar subasta" : "Publicar"}
          onPress={handleSubmit}
          loading={submitting}
        />
      </View>

      <Modal
        visible={conditionOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setConditionOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setConditionOpen(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Condición</Text>
            {CONDITIONS.map((opt) => {
              const active = form.values.condition === opt;
              return (
                <Pressable
                  key={opt}
                  style={styles.modalOption}
                  onPress={() => {
                    form.setValue("condition", opt);
                    setConditionOpen(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, active && styles.modalOptionTextOn]}>{opt}</Text>
                  {active && <Ionicons name="checkmark" size={18} color={palette.primary} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  header: { backgroundColor: palette.background, paddingHorizontal: 18, paddingBottom: 8 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontFamily: fonts.bold, fontSize: 15, color: "#3A3D46" },
  content: { padding: 18, paddingBottom: 20 },
  photosRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  addPhoto: {
    width: 72, height: 72, borderRadius: 14, borderWidth: 2, borderStyle: "dashed",
    borderColor: "#C7CBD4", backgroundColor: "#fff", justifyContent: "center", alignItems: "center",
  },
  cameraPhoto: {
    width: 72, height: 72, borderRadius: 14, borderWidth: 2, borderStyle: "dashed",
    borderColor: "#C7CBD4", backgroundColor: "#fff", justifyContent: "center", alignItems: "center",
  },
  photo: { width: 72, height: 72, borderRadius: 14 },
  photoIndex: {
    position: "absolute", bottom: 4, right: 4, backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1,
  },
  photoIndexText: { color: "#fff", fontFamily: fonts.mono, fontSize: 9 },
  label: { fontFamily: fonts.bold, fontSize: 13, color: "#3A3D46", marginBottom: 9 },
  fieldError: { fontFamily: fonts.medium, fontSize: 12, color: palette.error, marginTop: 5 },
  toggleRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  toggle: { flex: 1, height: 46, borderRadius: 13, borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  toggleOn: { borderColor: palette.primary, backgroundColor: palette.primaryContainer },
  toggleOff: { borderColor: palette.border },
  toggleOnText: { fontFamily: fonts.extrabold, fontSize: 13, color: palette.primary },
  toggleOffText: { fontFamily: fonts.bold, fontSize: 13, color: "#7C808B" },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  pill: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  pillOn: { backgroundColor: palette.primary },
  pillOff: { backgroundColor: palette.fill },
  pillOnText: { fontFamily: fonts.bold, fontSize: 12, color: "#fff" },
  pillOffText: { fontFamily: fonts.bold, fontSize: 12, color: "#5A5F6A" },
  select: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    height: 48, borderRadius: 13, borderWidth: 1.5, borderColor: palette.border,
    backgroundColor: "#fff", paddingHorizontal: 14, marginBottom: 4,
  },
  selectError: { borderColor: palette.error },
  selectValue: { fontFamily: fonts.medium, fontSize: 14, color: palette.textPrimary },
  selectPlaceholder: { fontFamily: fonts.regular, fontSize: 14, color: "#9499A3" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 28 },
  modalTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: palette.textPrimary, marginBottom: 8 },
  modalOption: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F2F3F6",
  },
  modalOptionText: { fontFamily: fonts.bold, fontSize: 14, color: "#5A5F6A" },
  modalOptionTextOn: { color: palette.primary },
  footer: { padding: 18, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: palette.borderLight },
});
