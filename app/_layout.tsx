import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { Suspense, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import "../global.css";

import { WorkoutProvider } from "./(tabs)/context/workoutcontext";

async function loadDatabase(): Promise<void> {
  const dbName = "inicializedatabase.sqlite";
  const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;

  await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}SQLite`, {
    intermediates: true,
  });

  const fileInfo = await FileSystem.getInfoAsync(dbPath);
  if (!fileInfo.exists) {
    await FileSystem.downloadAsync(
      Asset.fromModule(require("../src/inicializedatabase.sqlite")).uri,
      dbPath,
    );
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    loadDatabase()
      .then(() => setDbReady(true))
      .catch((e) => console.error("Erro ao carregar BD:", e));
  }, []);

  if (!dbReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#E31C25" />
      </View>
    );
  }

  return (
    <Suspense
      fallback={
        <View
          style={{
            flex: 1,
            backgroundColor: "#000",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color="#E31C25" />
        </View>
      }
    >
      <SQLiteProvider databaseName="inicializedatabase.sqlite" useSuspense>
        <WorkoutProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="gender" options={{ gestureEnabled: false }} />
              <Stack.Screen
                name="birthday"
                options={{ gestureEnabled: false }}
              />
              <Stack.Screen name="weight" options={{ gestureEnabled: false }} />
              <Stack.Screen name="height" options={{ gestureEnabled: false }} />
              <Stack.Screen
                name="workoutschedule"
                options={{ gestureEnabled: false }}
              />
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="auth/signup" />
              <Stack.Screen name="auth/login" />
              <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
              <Stack.Screen
                name="workouthistory"
                options={{
                  presentation: "modal",
                  animation: "slide_from_right",
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
        </WorkoutProvider>
      </SQLiteProvider>
    </Suspense>
  );
}
