import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require("../../assets/images/onboarding3.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Login</Text>

        <BlurView intensity={80} tint="dark" style={styles.glassCard}>
          <Text style={styles.welcomeText}>Welcome Back</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor="#ccc"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholderTextColor="#ccc"
            />
          </View>

          <TouchableOpacity>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mainButton}
            onPress={() => router.push("../GenderSelection")}
          >
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>
        </BlurView>

        <TouchableOpacity
          onPress={() => router.push("/auth/signup")}
          style={styles.footerContainer}
        >
          <Text style={styles.footerText}>
            {/* Corrigindo o erro de ESLint: "Don't" deve ser escrito assim */}
            {"Don't have an account? "}
            <Text style={styles.signUpLink}>Sign up!</Text>
          </Text>
        </TouchableOpacity>

        <Text style={styles.helpText}>Need Help?</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: width,
    height: height,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  headerTitle: {
    fontSize: 42,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  glassCard: {
    width: "100%",
    padding: 25,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  welcomeText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 25,
  },
  inputGroup: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.3)",
  },
  label: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 2,
  },
  input: {
    color: "#fff",
    height: 40,
    fontSize: 16,
    paddingVertical: 5,
  },
  forgotText: {
    color: "#fff",
    alignSelf: "flex-end",
    fontSize: 13,
    marginBottom: 25,
    opacity: 0.8,
  },
  mainButton: {
    backgroundColor: "#fff",
    height: 55,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
    textTransform: "uppercase",
  },
  footerContainer: {
    marginTop: 30,
  },
  footerText: {
    color: "#fff",
    fontSize: 14,
  },
  signUpLink: {
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  helpText: {
    color: "rgba(255,255,255,0.6)",
    marginTop: 15,
    fontSize: 12,
  },
});
