import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React from "react";
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SignupScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require("../../assets/images/onboarding1.jpg")} // Usa a tua imagem de fundo de treino
      style={styles.background}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Text style={styles.headerTitle}>Signup</Text>

        <BlurView intensity={60} tint="dark" style={styles.glassCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} placeholderTextColor="#888" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} keyboardType="email-address" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} secureTextEntry />
          </View>

          <TouchableOpacity
            style={styles.mainButton}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.buttonText}>SIGN UP</Text>
          </TouchableOpacity>
        </BlurView>

        <TouchableOpacity onPress={() => router.push("/auth/login")}>
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.link}>Login</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  headerTitle: {
    fontSize: 40,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 30,
    fontFamily: "serif",
  },
  glassCard: {
    width: "100%",
    padding: 25,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  inputGroup: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.3)",
  },
  label: { color: "#fff", fontSize: 14, marginBottom: -5 },
  input: { color: "#fff", height: 45, fontSize: 16 },
  mainButton: {
    backgroundColor: "#fff",
    height: 55,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#000", fontWeight: "bold", fontSize: 16 },
  footerText: { color: "#fff", marginTop: 30, fontSize: 14 },
  link: { fontWeight: "bold", textDecorationLine: "underline" },
});
