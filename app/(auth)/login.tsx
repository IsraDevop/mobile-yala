import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Button, SegmentedButtons, Text, TextInput } from "react-native-paper";
import { router } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { useToast } from "../../src/context/ToastContext";
import { useForm } from "../../src/hooks/useForm";
import { authService } from "../../src/services/authService";
import { getApiErrorMessage } from "../../src/utils/apiError";
import { isValidEmail, isValidPassword, isValidName } from "../../src/utils/validators";
import { palette } from "../../src/theme/theme";

type Tab = "login" | "register";

export default function LoginScreen() {
  const [tab, setTab] = useState<Tab>("login");
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);
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
      const data = await authService.register({ name: name.trim(), email: email.trim(), password });
      await login(data);
      router.replace("/(tabs)");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logo}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>Y</Text>
          </View>
          <Text variant="headlineMedium" style={styles.logoText}>Yala</Text>
          <Text variant="bodyMedium" style={styles.tagline}>
            Subastas de coleccionables geek.
          </Text>
        </View>

        <View style={styles.card}>
          <SegmentedButtons
            value={tab}
            onValueChange={(v) => setTab(v as Tab)}
            buttons={[
              { value: "login", label: "Ingresar" },
              { value: "register", label: "Crear cuenta" },
            ]}
            style={styles.tabs}
          />

          {tab === "login" ? (
            <View style={styles.form}>
              <TextInput
                label="Email *"
                value={loginForm.values.email}
                onChangeText={(t) => loginForm.setValue("email", t)}
                error={!!loginForm.errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                mode="outlined"
                style={styles.input}
              />
              {loginForm.errors.email && (
                <Text style={styles.fieldError}>{loginForm.errors.email}</Text>
              )}
              <TextInput
                label="Contraseña *"
                value={loginForm.values.password}
                onChangeText={(t) => loginForm.setValue("password", t)}
                error={!!loginForm.errors.password}
                secureTextEntry={!showPass}
                mode="outlined"
                style={styles.input}
                right={
                  <TextInput.Icon
                    icon={showPass ? "eye-off" : "eye"}
                    onPress={() => setShowPass((p) => !p)}
                  />
                }
              />
              {loginForm.errors.password && (
                <Text style={styles.fieldError}>{loginForm.errors.password}</Text>
              )}
              <Button
                mode="contained"
                onPress={handleLogin}
                loading={submitting}
                disabled={submitting}
                style={styles.submitBtn}
                contentStyle={styles.submitContent}
              >
                Ingresar
              </Button>
              <Button onPress={() => setTab("register")}>
                ¿No tenés cuenta? Creá una
              </Button>
            </View>
          ) : (
            <View style={styles.form}>
              <TextInput
                label="Nombre *"
                value={registerForm.values.name}
                onChangeText={(t) => registerForm.setValue("name", t)}
                error={!!registerForm.errors.name}
                mode="outlined"
                style={styles.input}
              />
              {registerForm.errors.name && (
                <Text style={styles.fieldError}>{registerForm.errors.name}</Text>
              )}
              <TextInput
                label="Email *"
                value={registerForm.values.email}
                onChangeText={(t) => registerForm.setValue("email", t)}
                error={!!registerForm.errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                mode="outlined"
                style={styles.input}
              />
              {registerForm.errors.email && (
                <Text style={styles.fieldError}>{registerForm.errors.email}</Text>
              )}
              <TextInput
                label="Contraseña *"
                value={registerForm.values.password}
                onChangeText={(t) => registerForm.setValue("password", t)}
                error={!!registerForm.errors.password}
                secureTextEntry={!showPass}
                mode="outlined"
                style={styles.input}
                right={
                  <TextInput.Icon
                    icon={showPass ? "eye-off" : "eye"}
                    onPress={() => setShowPass((p) => !p)}
                  />
                }
              />
              {registerForm.errors.password && (
                <Text style={styles.fieldError}>{registerForm.errors.password}</Text>
              )}
              <Button
                mode="contained"
                onPress={handleRegister}
                loading={submitting}
                disabled={submitting}
                style={styles.submitBtn}
                contentStyle={styles.submitContent}
              >
                Crear cuenta
              </Button>
              <Button onPress={() => setTab("login")}>Ya tengo cuenta</Button>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  container: { flexGrow: 1, justifyContent: "center", padding: 24 },
  logo: { alignItems: "center", marginBottom: 32 },
  logoIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: palette.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  logoIconText: { color: "#fff", fontSize: 28, fontWeight: "900" },
  logoText: { fontWeight: "900", color: palette.textPrimary },
  tagline: { color: palette.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  tabs: { marginBottom: 20 },
  form: { gap: 4 },
  input: { marginBottom: 4 },
  fieldError: { color: palette.error, fontSize: 12, marginBottom: 4 },
  submitBtn: { marginTop: 16, marginBottom: 8, borderRadius: 12, backgroundColor: palette.primary },
  submitContent: { paddingVertical: 6 },
});
