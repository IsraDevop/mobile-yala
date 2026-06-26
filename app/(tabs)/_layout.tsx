import { Redirect, Tabs } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { Loader } from "../../src/components/Loader";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "../../src/theme/theme";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { useState, useEffect } from "react";
import { notificationService } from "../../src/services/notificationService";

function NotificationTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    notificationService.getUnreadCount().then(setCount).catch(() => {});
  }, []);

  return (
    <View>
      <Ionicons
        name={focused ? "notifications" : "notifications-outline"}
        size={24}
        color={color}
      />
      {count > 0 && (
        <View style={{
          position: "absolute", top: -4, right: -8,
          backgroundColor: palette.badge ?? "#EF4444",
          borderRadius: 8, minWidth: 16, height: 16,
          justifyContent: "center", alignItems: "center",
        }}>
          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
            {count > 9 ? "9+" : count}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textSecondary,
        tabBarStyle: { backgroundColor: "#fff", borderTopColor: palette.border },
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: palette.primary,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: "Vender",
          tabBarIcon: ({ color }) => (
            <Ionicons name="add-circle" size={28} color={palette.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Órdenes",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "receipt" : "receipt-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Alertas",
          tabBarIcon: ({ color, focused }) => (
            <NotificationTabIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
