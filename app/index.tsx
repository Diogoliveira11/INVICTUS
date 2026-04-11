import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      // REMOVER DEPOIS DE TESTAR await AsyncStorage.clear();

      await new Promise((resolve) => setTimeout(resolve, 2000));

      try {
        const userEmail = await AsyncStorage.getItem("userEmail");
        const hasOnboarded = await AsyncStorage.getItem("hasOnboarded");

        if (userEmail) {
          router.replace("/(tabs)/home");
        } else if (!hasOnboarded) {
          router.replace("/onboarding");
        } else {
          router.replace("/auth/login");
        }
      } catch (e) {
        router.replace("/onboarding");
      }
    };

    checkSession();
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/logo_invictus.jpeg")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1e1e",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: { width: "90%", height: "70%" },
});
