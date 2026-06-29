import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../src/context/AuthContext";
import { useToast } from "../src/context/ToastContext";
import { useFetch } from "../src/hooks/useFetch";
import { useForm } from "../src/hooks/useForm";
import { authService } from "../src/services/authService";
import { getApiErrorMessage } from "../src/utils/apiError";
import { getAvatarInitials } from "../src/utils/formatters";
import { pickImageFromGallery } from "../src/utils/imageUtils";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { Field } from "../src/components/Field";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { palette, fonts } from "../src/theme/theme";
import type { User } from "../src/types";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const { data: fullUser } = useFetch<User>("/users/me");

  const me = fullUser ?? user;
  const form = useForm({
    name: fullUser?.name ?? user?.name ?? "",
    avatarUrl: fullUser?.avatarUrl ?? "",
  });

  async function handleSave() {
    if (!form.values.name.trim()) {
      form.setError("name", "El nombre es obligatorio");
      return;
    }
    try {
      setSaving(true);
      await authService.updateCurrentUser({
        name: form.values.name.trim(),
        avatarUrl: form.values.avatarUrl.trim() || undefined,
      });
      showToast("Perfil actualizado", "success");
      router.back();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handlePickAvatar() {
    const uri = await pickImageFromGallery();
    if (uri) form.setValue("avatarUrl", uri);
  }

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  if (!me) return null;

  return (
    <View style={styles.flex}>
      <ScreenHeader
        title="Editar perfil"
        right={
          <Pressable onPress={handleSave} hitSlop={8}>
            <Text style={styles.save}>Guardar</Text>
          </Pressable>
        }
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
          <Pressable onPress={handlePickAvatar}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getAvatarInitials(form.values.name || me.name)}</Text>
            </View>
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </Pressable>
          <Pressable onPress={handlePickAvatar}>
            <Text style={styles.changeAvatar}>Cambiar avatar</Text>
          </Pressable>
        </View>

        <Field
          label="Nombre"
          value={form.values.name}
          onChangeText={(t) => form.setValue("name", t)}
          error={form.errors.name}
        />
        <Field label="Email" value={me.email} editable={false} disabled />
        <Field
          label="URL de avatar"
          value={form.values.avatarUrl}
          onChangeText={(t) => form.setValue("avatarUrl", t)}
          autoCapitalize="none"
          placeholder="https://…"
        />

        <Pressable style={styles.logout} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={palette.error} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 18 }]}>
        <PrimaryButton label="Guardar cambios" onPress={handleSave} loading={saving} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  save: { fontFamily: fonts.extrabold, fontSize: 13, color: palette.primary },
  content: { padding: 22, paddingBottom: 30 },
  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: palette.avatarBg,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: palette.primary, fontFamily: fonts.extrabold, fontSize: 34 },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: palette.primary,
    borderWidth: 3,
    borderColor: palette.background,
    justifyContent: "center",
    alignItems: "center",
  },
  changeAvatar: { fontFamily: fonts.bold, fontSize: 12, color: palette.primary, marginTop: 12 },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#ECEDF1",
  },
  logoutText: { fontFamily: fonts.bold, fontSize: 14, color: palette.error },
  footer: { padding: 18, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: palette.borderLight },
});
