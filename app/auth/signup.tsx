import { BlurView } from "expo-blur";
import {
    ImageBackground,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function Login() {
  return (
    <ImageBackground
      source={require("../../assets/images/login-bg.jpg")}
      style={styles.bg}
    >
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Login</Text>

        <BlurView intensity={20} style={styles.glassCard}>
          <Text style={styles.welcome}>Welcome Back</Text>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#999"
            style={styles.input}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#999"
            style={styles.input}
            secureTextEntry
          />

          <TouchableOpacity style={styles.loginBtn}>
            <Text style={styles.loginText}>Log In</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerTitle: {
    fontSize: 40,
    color: "#FFF",
    fontWeight: "bold",
    marginBottom: 20,
  },
  glassCard: {
    width: "85%",
    padding: 25,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  welcome: { color: "#FFF", fontSize: 20, marginBottom: 20 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#666",
    color: "#FFF",
    marginBottom: 20,
    padding: 10,
  },
  loginBtn: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
  },
  loginText: { fontWeight: "bold", color: "#000" },
});
