import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { Suspense, useEffect, useState } from "react";
import { ActivityIndicator, LogBox, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

import { WorkoutSettingsProvider } from "../context/settings_context";
import { UnitsProvider } from "../context/units_context";
import { WorkoutProvider } from "../context/workoutcontext";

LogBox.ignoreLogs(["SafeAreaView has been deprecated"]);
LogBox.ignoreLogs(["Text strings must be rendered"]);

async function loadDatabase(): Promise<void> {
  const dbName = "inicializedatabase.sqlite";
  const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;

  const dirInfo = await FileSystem.getInfoAsync(
    `${FileSystem.documentDirectory}SQLite`,
  );
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(
      `${FileSystem.documentDirectory}SQLite`,
      { intermediates: true },
    );
  }

  const fileInfo = await FileSystem.getInfoAsync(dbPath);
  if (!fileInfo.exists) {
    // @ts-ignore
    const dbModule = await import("../src/inicializedatabase.sqlite");
    const asset = await Asset.fromModule(dbModule).downloadAsync();
    await FileSystem.copyAsync({ from: asset.localUri!, to: dbPath });
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {},
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    loadDatabase()
      .then(() => setDbReady(true))
      .catch((e) => console.error("Error starting the app:", e));
  }, []);

  LogBox.ignoreLogs([
    "SafeAreaView has been deprecated",
    "expo-notifications: Android Push notifications",
    "expo-notifications functionality is not fully supported",
  ]);

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
        <UnitsProvider>
          <WorkoutSettingsProvider>
            <WorkoutProvider>
              <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
              >
                <SafeAreaProvider>
                  <View style={{ flex: 1 }}>
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="index" />
                      <Stack.Screen name="onboarding" />
                      <Stack.Screen name="auth/signup" />
                      <Stack.Screen name="auth/login" />
                      <Stack.Screen
                        name="gender"
                        options={{ gestureEnabled: false }}
                      />
                      <Stack.Screen
                        name="units"
                        options={{ gestureEnabled: false }}
                      />
                      <Stack.Screen
                        name="birthday"
                        options={{ gestureEnabled: false }}
                      />
                      <Stack.Screen
                        name="weight"
                        options={{ gestureEnabled: false }}
                      />
                      <Stack.Screen
                        name="height"
                        options={{ gestureEnabled: false }}
                      />
                      <Stack.Screen
                        name="workoutschedule"
                        options={{ gestureEnabled: false }}
                      />
                      <Stack.Screen
                        name="(tabs)"
                        options={{ gestureEnabled: false }}
                      />
                      <Stack.Screen
                        name="workouthistory"
                        options={{ animation: "slide_from_right" }}
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
                  </View>
                </SafeAreaProvider>
              </ThemeProvider>
            </WorkoutProvider>
          </WorkoutSettingsProvider>
        </UnitsProvider>
      </SQLiteProvider>
    </Suspense>
  );
}
