import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { Pressable, Text, View, Image } from "react-native";
import { useRouter } from "expo-router";

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

const brandHeader = {
  headerStyle: { backgroundColor: "#061428" },
  headerTintColor: "#ffffff",
  headerTitleStyle: { fontWeight: "600" as const },
  headerBackTitleVisible: false,
  headerLeft: () => {
    const router = useRouter();
    return (
      <Pressable
        onPress={() => router.back()}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 8,
          marginLeft: 8,
          borderRadius: 999,
          backgroundColor: "#0a1e3b",
        }}
      >
        <Text style={{ color: "#22d3ee", fontWeight: "700" }}>Back</Text>
      </Pressable>
    );
  },
  headerTitleAlign: "center" as const,
  headerTitle: ({ children }: { children: React.ReactNode }) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Image
        source={require("@/assets/images/icon_copy.png")}
        style={{ width: 28, height: 28 }}
      />
      <Text style={{ color: "white", fontWeight: "700" }}>{children}</Text>
    </View>
  ),
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={brandHeader}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="upload"
          options={{ title: "Upload", animation: "fade" }}
        />
        <Stack.Screen
          name="processing"
          options={{ title: "", headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="results"
          options={{ title: "Results", animation: "fade" }}
        />
        <Stack.Screen name="quiz" options={{ title: "Quiz" }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
