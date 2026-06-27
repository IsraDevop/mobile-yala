import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import { useToast } from "../../src/context/ToastContext";
import { useForm } from "../../src/hooks/useForm";
import { authService } from "../../src/services/authService";
import { getApiErrorMessage } from "../../src/utils/apiError";
import { isValidEmail, isValidPassword, isValidName } from "../../src/utils/validators";
import { Logo } from "../../src/components/Logo";
import { Field } from "../../src/components/Field";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { palette, fonts } from "../../src/theme/theme";
import type { UserRole } from "../../src/types";

type Tab = "login" | "register";

export default function LoginScreen() {
  const [tab, setTab] = useState<Tab>("login");
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState<UserRole>("USER");
  const { login } = useAuth();
  const { showToast } = useToast();

  const loginForm = useForm({ email: "", password: "" });
  const registerForm = useForm({ name: "", email: "", password: "" });

  async function handleLogin() {
    const { email, password } = loginForm.values;
    let valid = true;
    if (!isValidEmail(email)) { loginForm.setError("email", "Email inválido"); valid = false; }
    if (!isValidPassword(password)) { loginForm.setError("password", "Mínimo 8 caracteres"); valid = false; }
    if (!valid) return;
    try {
      setSubmitting(true);
      const data = await authService.login({ email: email.trim(), password });
      await login(data);
      router.replace("/(tabs)");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister() {
    const { name, email, password } = registerForm.values;
    let valid = true;
    if (!isValidName(name)) { registerForm.setError("name", "Mínimo 2 caracteres"); valid = false; }
    if (!isValidEmail(email)) { registerForm.setError("email", "Email inválido"); valid = false; }
    if (!isValidPassword(password)) { registerForm.setError("password", "Mínimo 8 caracteres"); valid = false; }
    if (!valid) return;
    try {
      setSubmitting(true);
      const data = await authService.register({ name: name.trim(), email: email.trim(), password, role });
      await login(data);
      router.replace("/(tabs)");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  const eye = (
    <Pressable onPress={() => setShowPass((p) => !p)} hitSlop={8}>
      <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={20} color="#9499A3" />
    </Pressable>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logo}>
          <Logo size={30} />
          <Text style={styles.tagline}>
            {tab === "login" ? "Subastas de coleccionables geek." : "Crea tu cuenta en segundos."}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.tabs}>
            <Pressable onPress={() => setTab("login")}>
              <Text style={[styles.tab, tab === "login" && styles.tabActive]}>Ingresar</Text>
              {tab === "login" && <View style={styles.underline} />}
            </Pressable>
            <Pressable onPress={() => setTab("register")}>
              <Text style={[styles.tab, tab === "register" && styles.tabActive]}>Crear cuenta</Text>
              {tab === "register" && <View style={styles.underline} />}
            </Pressable>
          </View>

          {tab === "login" ? (
            <>
              <Field
                label="Email"
                placeholder="tu@email.com"
                value={loginForm.values.email}
                onChangeText={(t) => loginForm.setValue("email", t)}
                error={loginForm.errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Field
                label="Contraseña"
                placeholder="••••••••"
                value={loginForm.values.password}
                onChangeText={(t) => loginForm.setValue("password", t)}
                error={loginForm.errors.password}
                secureTextEntry={!showPass}
                right={eye}
              />
              <View style={styles.btn}>
                <PrimaryButton label="Ingresar" onPress={handleLogin} loading={submitting} />
              </View>
              <Pressable onPress={() => setTab("register")} style={styles.linkRow}>
                <Text style={styles.linkMuted}>
                  ¿No tienes cuenta? <Text style={styles.link}>Crea una</Text>
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Field
                label="Nombre"
                placeholder="Ana Torres"
                value={registerForm.values.name}
                onChangeText={(t) => registerForm.setValue("name", t)}
                error={registerForm.errors.name}
              />
              <Field
                label="Email"
                placeholder="tu@email.com"
                value={registerForm.values.email}
                onChangeText={(t) => registerForm.setValue("email", t)}
                error={registerForm.errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Field
                label="Contraseña"
                placeholder="••••••••"
                value={registerForm.values.password}
                onChangeText={(t) => registerForm.setValue("password", t)}
                error={registerForm.errors.password}
                secureTextEntry={!showPass}
                right={eye}
              />
              <Text style={styles.quieroLabel}>Quiero</Text>
              <View style={styles.toggleRow}>
                <Pressable
                  style={[styles.toggle, role === "USER" ? styles.toggleOn : styles.toggleOff]}
                  onPress={() => setRole("USER")}
                >
                  <Text style={role === "USER" ? styles.toggleOnText : styles.toggleOffText}>Comprar</Text>
                </Pressable>
                <Pressable
                  style={[styles.toggle, role === "SELLER" ? styles.toggleOn : styles.toggleOff]}
                  onPress={() => setRole("SELLER")}
                >
                  <Text style={role === "SELLER" ? styles.toggleOnText : styles.toggleOffText}>Vender</Text>
                </Pressable>
              </View>
              <View style={styles.btn}>
                <PrimaryButton label="Crear cuenta" onPress={handleRegister} loading={submitting} />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  container: { flexGrow: 1, justifyContent: "center", padding: 26 },
  logo: { alignItems: "center", marginBottom: 30 },
  tagline: { fontFamily: fonts.medium, fontSize: 14, color: "#8A8F98", marginTop: 14 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "#F0F1F4",
    shadowColor: "#11142D",
    shadowOpacity: 0.06,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  tabs: { flexDirection: "row", gap: 22, borderBottomWidth: 1, borderBottomColor: "#EEEFF2", marginBottom: 22 },
  tab: { fontFamily: fonts.semibold, fontSize: 15, color: "#A2A6B0", paddingBottom: 12 },
  tabActive: { fontFamily: fonts.extrabold, color: palette.primary },
  underline: { height: 2.5, backgroundColor: palette.primary, borderRadius: 2, marginTop: -2.5 },
  btn: { marginTop: 8 },
  linkRow: { alignItems: "center", marginTop: 18 },
  linkMuted: { fontFamily: fonts.medium, fontSize: 13, color: "#8A8F98" },
  link: { fontFamily: fonts.bold, color: palette.primary },
  quieroLabel: { fontFamily: fonts.bold, fontSize: 13, color: "#3A3D46", marginBottom: 9 },
  toggleRow: { flexDirection: "row", gap: 10, marginBottom: 6 },
  toggle: { flex: 1, height: 46, borderRadius: 13, borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  toggleOn: { borderColor: palette.primary, backgroundColor: palette.primaryContainer },
  toggleOff: { borderColor: palette.border },
  toggleOnText: { fontFamily: fonts.extrabold, fontSize: 13, color: palette.primary },
  toggleOffText: { fontFamily: fonts.bold, fontSize: 13, color: "#7C808B" },
});
