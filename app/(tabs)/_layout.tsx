import { Redirect, Tabs } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { Loader } from "../../src/components/Loader";
import { TabBar } from "../../src/components/TabBar";

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="auctions" />
      <Tabs.Screen name="sell" />
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
