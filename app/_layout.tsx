import { useEffect } from "react";
import { PaperProvider } from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { isLiveKitAvailable } from "../src/utils/liveKit";

if (isLiveKitAvailable()) {
  try {
    require("@livekit/react-native").registerGlobals();
  } catch {}
}
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
  JetBrainsMono_800ExtraBold,
} from "@expo-google-fonts/jetbrains-mono";
import { AuthProvider } from "../src/context/AuthContext";
import { ToastProvider } from "../src/context/ToastContext";
import { lightTheme } from "../src/theme/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
    JetBrainsMono_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={lightTheme}>
        <AuthProvider>
          <ToastProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F5F6F8" } }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="listing/[id]" />
              <Stack.Screen name="auction/[id]" />
              <Stack.Screen name="live/[id]" />
              <Stack.Screen name="seller/[id]" />
              <Stack.Screen name="create-auction" />
              <Stack.Screen name="camera" />
              <Stack.Screen name="orders" />
              <Stack.Screen name="pending-payments" />
              <Stack.Screen name="order/[id]" />
              <Stack.Screen name="edit-profile" />
              <Stack.Screen name="my-sales" />
              <Stack.Screen name="seller/apply" />
              <Stack.Screen name="seller/go-live" />
            </Stack>
          </ToastProvider>
        </AuthProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
