import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Avatar, Button, Dialog, Divider, Portal, Text, TextInput } from "react-native-paper";
import { router } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { useToast } from "../../src/context/ToastContext";
import { useForm } from "../../src/hooks/useForm";
import { authService } from "../../src/services/authService";
import { getApiErrorMessage } from "../../src/utils/apiError";
import { getAvatarInitials } from "../../src/utils/formatters";
import { palette } from "../../src/theme/theme";
import { RatingStars } from "../../src/components/RatingStars";
import { useFetch } from "../../src/hooks/useFetch";
import type { User } from "../../src/types";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [editDialog, setEditDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: fullUser, refetch } = useFetch<User>("/users/me");
  const form = useForm({ name: fullUser?.name ?? "", avatarUrl: fullUser?.avatarUrl ?? "" });

  async function handleSave() {
    try {
      setSaving(true);
      await authService.updateCurrentUser({
        name: form.values.name.trim() || undefined,
        avatarUrl: form.values.avatarUrl.trim() || undefined,
      });
      showToast("Perfil actualizado", "success");
      setEditDialog(false);
      refetch();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  const displayUser = fullUser ?? user;
  if (!displayUser) return null;

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <View style={styles.avatarSection}>
        {fullUser?.avatarUrl ? (
          <Avatar.Image size={80} source={{ uri: fullUser.avatarUrl }} />
        ) : (
          <Avatar.Text size={80} label={getAvatarInitials(displayUser.name)} />
        )}
        <Text variant="headlineSmall" style={styles.name}>{displayUser.name}</Text>
        <Text variant="bodyMedium" style={styles.email}>{displayUser.email}</Text>
        <Text variant="labelMedium" style={styles.role}>
          {displayUser.role === "SELLER" ? "Vendedor verificado ✓" : "Usuario en Yala"}
        </Text>
        {fullUser && <RatingStars rating={fullUser.reputation} />}
      </View>

      <Divider style={styles.divider} />

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text variant="headlineMedium" style={styles.statValue}>
            {fullUser?.reputation?.toFixed(1) ?? "0.0"}
          </Text>
          <Text variant="labelSmall" style={styles.statLabel}>Reputación</Text>
        </View>
        <View style={styles.stat}>
          <Text variant="headlineMedium" style={styles.statValue}>
            {displayUser.role}
          </Text>
          <Text variant="labelSmall" style={styles.statLabel}>Rol</Text>
        </View>
      </View>

      <Divider style={styles.divider} />

      <Button
        mode="outlined"
        icon="pencil"
        onPress={() => {
          form.reset();
          setEditDialog(true);
        }}
        style={styles.btn}
      >
        Editar perfil
      </Button>

      {displayUser.role === "SELLER" && (
        <Button
          mode="contained"
          icon="plus"
          onPress={() => router.push("/(tabs)/sell")}
          style={[styles.btn, { backgroundColor: palette.primary }]}
        >
          Nueva publicación
        </Button>
      )}

      <Button
        mode="outlined"
        icon="logout"
        onPress={handleLogout}
        style={[styles.btn, styles.logoutBtn]}
        textColor={palette.error}
      >
        Cerrar sesión
      </Button>

      <Portal>
        <Dialog visible={editDialog} onDismiss={() => setEditDialog(false)}>
          <Dialog.Title>Editar perfil</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <TextInput
              label="Nombre"
              value={form.values.name}
              onChangeText={(t) => form.setValue("name", t)}
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="URL de avatar"
              value={form.values.avatarUrl}
              onChangeText={(t) => form.setValue("avatarUrl", t)}
              mode="outlined"
              keyboardType="url"
              autoCapitalize="none"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialog(false)}>Cancelar</Button>
            <Button onPress={handleSave} loading={saving} disabled={saving}>
              Guardar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  container: { padding: 24 },
  avatarSection: { alignItems: "center", gap: 8, marginBottom: 16 },
  name: { fontWeight: "800", color: palette.textPrimary },
  email: { color: palette.textSecondary },
  role: { color: palette.primary },
  divider: { marginVertical: 16 },
  stats: { flexDirection: "row", justifyContent: "space-around" },
  stat: { alignItems: "center" },
  statValue: { fontWeight: "900", color: palette.primary },
  statLabel: { color: palette.textSecondary, textTransform: "uppercase" },
  btn: { marginVertical: 6 },
  logoutBtn: { borderColor: palette.error },
  dialogContent: { gap: 12 },
  dialogInput: {},
});
