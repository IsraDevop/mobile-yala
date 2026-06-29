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
import { isValidEmail, isValidPassword, isValidName, isValidDni } from "../../src/utils/validators";
import { Logo } from "../../src/components/Logo";
import { Field } from "../../src/components/Field";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { palette, fonts } from "../../src/theme/theme";
type Tab = "login" | "register";

export default function LoginScreen() {
  const [tab, setTab] = useState<Tab>("login");
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  const loginForm = useForm({ email: "", password: "" });
  const registerForm = useForm({
    dni: "",
    nombres: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    email: "",
    password: "",
  });

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
    const { dni, nombres, apellidoPaterno, apellidoMaterno, email, password } = registerForm.values;
    let valid = true;
    if (!isValidDni(dni)) { registerForm.setError("dni", "El DNI debe tener 8 dígitos"); valid = false; }
    if (!isValidName(nombres)) { registerForm.setError("nombres", "Mínimo 2 caracteres"); valid = false; }
    if (!isValidName(apellidoPaterno)) { registerForm.setError("apellidoPaterno", "Mínimo 2 caracteres"); valid = false; }
    if (!isValidName(apellidoMaterno)) { registerForm.setError("apellidoMaterno", "Mínimo 2 caracteres"); valid = false; }
    if (!isValidEmail(email)) { registerForm.setError("email", "Email inválido"); valid = false; }
    if (!isValidPassword(password)) { registerForm.setError("password", "Mínimo 8 caracteres"); valid = false; }
    if (!valid) return;
    try {
      setSubmitting(true);
      const data = await authService.register({
        dni: dni.trim(),
        nombres: nombres.trim(),
        apellidoPaterno: apellidoPaterno.trim(),
        apellidoMaterno: apellidoMaterno.trim(),
        email: email.trim(),
        password,
      });
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
                label="DNI"
                placeholder="12345678"
                value={registerForm.values.dni}
                onChangeText={(t) => registerForm.setValue("dni", t.replace(/\D/g, "").slice(0, 8))}
                error={registerForm.errors.dni}
                keyboardType="number-pad"
              />
              <Field
                label="Nombres"
                placeholder="Ana Lucía"
                value={registerForm.values.nombres}
                onChangeText={(t) => registerForm.setValue("nombres", t)}
                error={registerForm.errors.nombres}
              />
              <Field
                label="Apellido paterno"
                placeholder="Torres"
                value={registerForm.values.apellidoPaterno}
                onChangeText={(t) => registerForm.setValue("apellidoPaterno", t)}
                error={registerForm.errors.apellidoPaterno}
              />
              <Field
                label="Apellido materno"
                placeholder="Mendoza"
                value={registerForm.values.apellidoMaterno}
                onChangeText={(t) => registerForm.setValue("apellidoMaterno", t)}
                error={registerForm.errors.apellidoMaterno}
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
});
