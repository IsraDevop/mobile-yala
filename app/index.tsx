import { Redirect } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { Loader } from "../src/components/Loader";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  return <Redirect href={isAuthenticated ? "/(tabs)" : "/(auth)/login"} />;
}
