import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import api from "../api";

export default function About() {
  const [aboutData, setAboutData] = useState({
    logo: "",
    description: "",
    features: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const response = await api.get("api/about/");
        setAboutData(response.data);
        setLoading(false);
      } catch (err) {
        setError("Не вдалося завантажити інформацію про додаток");
        setLoading(false);
        console.error("Помилка завантаження даних:", err);
      }
    };
    fetchAboutData();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Завантаження...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.title}>Про додаток</Text>
      {aboutData.logo && (
        <Image
          source={{ uri: aboutData.logo }}
          style={styles.logo}
          onError={(e) => {
            console.log("Помилка завантаження логотипу:", e.nativeEvent.error);
            setAboutData({ ...aboutData, logo: "https://picsum.photos/150" });
          }}
        />
      )}
      <Text style={styles.lead}>To-Do List — ваш надійний помічник!</Text>
      <Text style={styles.text}>{aboutData.description}</Text>
      <Text style={styles.text}>
        Наш додаток розроблений з урахуванням ваших потреб, пропонуючи
        інтуїтивно зрозумілий інтерфейс для управління завданнями.
      </Text>
      {aboutData.features && aboutData.features.length > 0 && (
        <>
          <Text style={styles.subtitle}>Що ви можете зробити:</Text>
          {aboutData.features.map((feature, index) => (
            <Text key={index} style={styles.feature}>
              • {feature}
            </Text>
          ))}
        </>
      )}
      <Text style={styles.text}>
        Завдяки простоті використання та гнучкості, наш додаток підходить як
        для особистого, так і для командного планування.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
    alignItems: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 16,
  },
  lead: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  text: {
    fontSize: 16,
    marginVertical: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    textAlign: "center",
  },
  feature: {
    fontSize: 16,
    marginVertical: 4,
    textAlign: "center",
  },
  error: {
    color: "red",
    fontSize: 16,
  },
});
