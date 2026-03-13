// 1. IMPORTANTE: Importar o CSS global aqui no topo
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../global.css";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Ecrãs de Onboarding e Auth */}
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth/signup" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="GenderSelection" />
        <Stack.Screen name="BirthdaySelection" />

        {/* O Grupo das Tabs (Home, Workout, Profile) */}
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />

        {/* Ecrãs de Detalhe (Abrem por cima da Home) */}
        <Stack.Screen
          name="workouthistory"
          options={{
            presentation: "modal", // No iOS abre de baixo para cima
            animation: "slide_from_right", // No Android desliza da direita
          }}
        />
        <Stack.Screen
          name="volumestats"
          options={{
            presentation: "modal",
            animation: "slide_from_right",
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
