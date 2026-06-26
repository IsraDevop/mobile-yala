import { useState, useCallback } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Chip, SegmentedButtons, Text, TextInput } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { useToast } from "../../src/context/ToastContext";
import { useForm } from "../../src/hooks/useForm";
import { useFetch } from "../../src/hooks/useFetch";
import { listingService } from "../../src/services/listingService";
import { getApiErrorMessage } from "../../src/utils/apiError";
import { isValidPrice } from "../../src/utils/validators";
import type { Category } from "../../src/types";
import { palette } from "../../src/theme/theme";
import { EmptyState } from "../../src/components/EmptyState";
import { Ionicons } from "@expo/vector-icons";

export default function SellScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [createdListingId, setCreatedListingId] = useState<number | null>(null);

  const { data: categories } = useFetch<Category[]>("/categories");

  const form = useForm({
    title: "",
    description: "",
    mode: "FIXED" as "FIXED" | "AUCTION",
    fixedPrice: "",
    condition: "",
    categoryId: 0,
    tags: "",
  });

  if (user?.role !== "SELLER" && user?.role !== "ADMIN") {
    return (
      <EmptyState
        icon="lock-closed-outline"
        title="Solo vendedores"
        description="Para publicar coleccionables necesitás una cuenta de vendedor verificado."
      />
    );
  }

  async function pickImage() {
    if (photos.length >= 5) {
      showToast("Máximo 5 imágenes por publicación", "error");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showToast("Permiso denegado. Actívalo en Configuración > Aplicaciones.", "error");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images" as any],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  }

  async function takePhoto() {
    if (photos.length >= 5) {
      showToast("Máximo 5 imágenes por publicación", "error");
      return;
    }
    router.push("/camera");
  }

  async function handleSubmit() {
    const { title, description, mode, fixedPrice, condition, categoryId } = form.values;
    let valid = true;

    if (!title.trim()) { form.setError("title", "El título es obligatorio"); valid = false; }
    if (!condition.trim()) { form.setError("condition", "La condición es obligatoria"); valid = false; }
    if (categoryId === 0) { form.setError("categoryId", "Seleccioná una categoría"); valid = false; }
    if (mode === "FIXED" && !isValidPrice(Number(fixedPrice))) {
      form.setError("fixedPrice", "Ingresá un precio válido");
      valid = false;
    }
    if (!valid) return;

    try {
      setSubmitting(true);
      const listing = await listingService.create({
        title: title.trim(),
        description: description.trim(),
        mode,
        fixedPrice: mode === "FIXED" ? Number(fixedPrice) : undefined,
        condition: condition.trim(),
        categoryId,
        tags: form.values.tags
          ? form.values.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
      });

      setCreatedListingId(listing.id);

      if (photos.length > 0) {
        setUploadingPhotos(true);
        await Promise.all(
          photos.map((uri, i) =>
            listingService.uploadImage(
              listing.id,
              {
                uri,
                name: `photo_${i}.jpg`,
                type: "image/jpeg",
              },
              i
            )
          )
        );
        setUploadingPhotos(false);
      }

      showToast("¡Publicación creada con éxito!", "success");

      if (mode === "AUCTION") {
        router.push(`/create-auction?listingId=${listing.id}`);
      } else {
        router.push(`/listing/${listing.id}`);
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
      setUploadingPhotos(false);
    }
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text variant="titleLarge" style={styles.sectionTitle}>Nueva publicación</Text>

      <View style={styles.photosRow}>
        {photos.map((uri, i) => (
          <Pressable
            key={i}
            onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
          >
            <Image source={{ uri }} style={styles.photo} />
            <View style={styles.removeIcon}>
              <Ionicons name="close-circle" size={20} color={palette.error} />
            </View>
          </Pressable>
        ))}
        {photos.length < 5 && (
          <View style={styles.photoActions}>
            <Pressable style={styles.photoBtn} onPress={pickImage}>
              <Ionicons name="images-outline" size={28} color={palette.primary} />
              <Text variant="labelSmall" style={styles.photoBtnText}>Galería</Text>
            </Pressable>
            <Pressable style={styles.photoBtn} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={28} color={palette.primary} />
              <Text variant="labelSmall" style={styles.photoBtnText}>Cámara</Text>
            </Pressable>
          </View>
        )}
      </View>

      <TextInput
        label="Título *"
        value={form.values.title}
        onChangeText={(t) => form.setValue("title", t)}
        error={!!form.errors.title}
        mode="outlined"
        style={styles.input}
      />
      {form.errors.title && <Text style={styles.fieldError}>{form.errors.title}</Text>}

      <TextInput
        label="Descripción"
        value={form.values.description}
        onChangeText={(t) => form.setValue("description", t)}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
      />

      <TextInput
        label="Condición *"
        value={form.values.condition}
        onChangeText={(t) => form.setValue("condition", t)}
        error={!!form.errors.condition}
        mode="outlined"
        placeholder="Ej: PSA 9 — Mint"
        style={styles.input}
      />
      {form.errors.condition && <Text style={styles.fieldError}>{form.errors.condition}</Text>}

      <Text variant="labelLarge" style={styles.label}>Modo de venta *</Text>
      <SegmentedButtons
        value={form.values.mode}
        onValueChange={(v) => form.setValue("mode", v as "FIXED" | "AUCTION")}
        buttons={[
          { value: "FIXED", label: "Precio fijo" },
          { value: "AUCTION", label: "Subasta" },
        ]}
        style={styles.input}
      />

      {form.values.mode === "FIXED" && (
        <>
          <TextInput
            label="Precio (S/.) *"
            value={form.values.fixedPrice}
            onChangeText={(t) => form.setValue("fixedPrice", t)}
            error={!!form.errors.fixedPrice}
            mode="outlined"
            keyboardType="decimal-pad"
            style={styles.input}
          />
          {form.errors.fixedPrice && <Text style={styles.fieldError}>{form.errors.fixedPrice}</Text>}
        </>
      )}

      <Text variant="labelLarge" style={styles.label}>Categoría *</Text>
      <View style={styles.categoriesRow}>
        {(categories ?? []).map((cat) => (
          <Chip
            key={cat.id}
            selected={form.values.categoryId === cat.id}
            onPress={() => form.setValue("categoryId", cat.id)}
            style={form.values.categoryId === cat.id ? styles.catSelected : styles.cat}
            textStyle={form.values.categoryId === cat.id ? { color: "#fff" } : {}}
          >
            {cat.name}
          </Chip>
        ))}
      </View>
      {form.errors.categoryId && <Text style={styles.fieldError}>{form.errors.categoryId}</Text>}

      <TextInput
        label="Tags (separados por coma)"
        value={form.values.tags}
        onChangeText={(t) => form.setValue("tags", t)}
        mode="outlined"
        placeholder="holo, 1st-edition, mint"
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={submitting || uploadingPhotos}
        disabled={submitting || uploadingPhotos}
        style={styles.submitBtn}
        contentStyle={styles.submitContent}
      >
        {form.values.mode === "AUCTION" ? "Crear y configurar subasta" : "Publicar"}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  container: { padding: 16, gap: 4 },
  sectionTitle: { fontWeight: "700", color: palette.textPrimary, marginBottom: 12 },
  photosRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  photo: { width: 80, height: 80, borderRadius: 8 },
  removeIcon: { position: "absolute", top: -8, right: -8 },
  photoActions: { flexDirection: "row", gap: 8 },
  photoBtn: {
    width: 80, height: 80, borderRadius: 8, borderWidth: 2,
    borderColor: palette.primary, borderStyle: "dashed",
    justifyContent: "center", alignItems: "center",
  },
  photoBtnText: { color: palette.primary, fontSize: 10, marginTop: 2 },
  input: { marginBottom: 4 },
  label: { color: palette.textSecondary, marginBottom: 8 },
  fieldError: { color: palette.error, fontSize: 12, marginBottom: 4 },
  categoriesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  cat: { backgroundColor: "#F3F4F6" },
  catSelected: { backgroundColor: palette.primary },
  submitBtn: { marginTop: 16, backgroundColor: palette.primary },
  submitContent: { paddingVertical: 6 },
});
