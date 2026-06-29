import Constants from "expo-constants";

export function isLiveKitAvailable(): boolean {
  return Constants.executionEnvironment !== "storeClient";
}
