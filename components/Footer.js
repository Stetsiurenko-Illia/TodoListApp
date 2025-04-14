import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Footer() {
  return (
    <View style={styles.footer}>
      <Text>Ⓒ Made by Illia Stetsiurenko 2025.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    padding: 10,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
  },
});