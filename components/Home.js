import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import Footer from "./Footer";
import {NavigationContainer} from '@react-navigation/native';

export default function App({ navigation }) {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("accessToken");
      setIsAuthenticated(!!token);
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowLogin(false);
    navigation.navigate("Tasks");
  };

  const handleSwitchToRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Плануй свої справи легко!</Text>
        <Text style={styles.subtitle}>Організуй свій день із нашим додатком.</Text>
        <View style={styles.actions}>
          {!isAuthenticated ? (
            <TouchableOpacity
              style={styles.button}
              onPress={() => setShowLogin(true)}
            >
              <Text style={styles.buttonText}>Старт</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("Tasks")}
            >
              <Text style={styles.buttonText}>Планувати</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("About")}
          >
            <Text style={styles.secondaryButtonText}>Про додаток</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Footer />
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={handleSwitchToRegister}
        />
      )}
      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: { fontSize: 32, fontWeight: "bold", textAlign: "center", marginBottom: 16 },
  subtitle: { fontSize: 18, textAlign: "center", marginBottom: 24 },
  actions: { flexDirection: "row", justifyContent: "center" },
  button: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#6c757d",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  secondaryButtonText: { color: "#6c757d", fontSize: 16 },
});