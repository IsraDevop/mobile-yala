import * as ImagePicker from "expo-image-picker";

export async function pickImageFromGallery(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    allowsEditing: true,
    aspect: [4, 3],
  });
  if (result.canceled || result.assets.length === 0) return null;
  return result.assets[0].uri;
}

export function uriToFile(uri: string, name = "photo.jpg"): { uri: string; name: string; type: string } {
  return { uri, name, type: "image/jpeg" };
}
