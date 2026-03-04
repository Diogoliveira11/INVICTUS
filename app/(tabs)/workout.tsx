import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FlatList, StyleSheet, TouchableOpacity } from "react-native";

// Dados fictícios para testar a interface sem base de dados
const TREINOS_EXEMPLO = [
  { id: "1", titulo: "Treino A - Peito e Tríceps", data: "Último: Ontem" },
  { id: "2", titulo: "Treino B - Costas e Bíceps", data: "Último: Segunda" },
  { id: "3", titulo: "Treino C - Pernas", data: "Último: Sábado" },
];

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">INVICTUS</ThemedText>
        <ThemedText type="subtitle">Os teus planos de treino</ThemedText>
      </ThemedView>

      <FlatList
        data={TREINOS_EXEMPLO}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <ThemedText type="defaultSemiBold">{item.titulo}</ThemedText>
            <ThemedText style={styles.dataText}>{item.data}</ThemedText>
          </TouchableOpacity>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#1a1a1a", // Podes ajustar conforme o teu tema
    padding: 20,
    borderRadius: 12,
    marginBottom: 18,
    borderLeftWidth: 4,
    borderLeftColor: "#A1CEDC",
  },
  dataText: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
});
