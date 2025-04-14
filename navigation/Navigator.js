import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TouchableOpacity, Text, Modal, View, StyleSheet } from "react-native";
import { Svg, Path } from "react-native-svg";

import Home from "../components/Home";
import About from "../components/About";
import Tasks from "../components/Tasks";
import Profile from "../components/Profile";

const Stack = createStackNavigator();

export default function Navigator() {
  const [menuVisible, setMenuVisible] = useState(false);

  const handleLogout = async (navigation) => {
    try {
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
      setMenuVisible(false);
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch (err) {
      console.error("Помилка виходу:", err);
    }
  };

  const handleProfile = (navigation) => {
    setMenuVisible(false);
    navigation.navigate("Profile");
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={Home}
          options={{
            title: "To-Do List",
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name="About"
          component={About}
          options={{ title: "Про додаток" }}
        />
        <Stack.Screen
          name="Tasks"
          component={Tasks}
          options={({ navigation }) => ({
            title: "Мої справи",
            headerRight: () => (
              <>
                <TouchableOpacity
                  style={{ marginRight: 16 }}
                  onPress={() => setMenuVisible(true)}
                >
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 2C9.24 2 7 4.24 7 7C7 9.76 9.24 12 12 12C14.76 12 17 9.76 17 7C17 4.24 14.76 2 12 2ZM12 14C8.69 14 6 16.69 6 20V22H18V20C18 16.69 15.31 14 12 14Z"
                      fill="#000"
                    />
                  </Svg>
                </TouchableOpacity>
                <Modal
                  transparent={true}
                  visible={menuVisible}
                  animationType="fade"
                  onRequestClose={() => setMenuVisible(false)}
                >
                  <TouchableOpacity
                    style={styles.modalOverlay}
                    onPress={() => setMenuVisible(false)}
                  >
                    <View style={styles.menu}>
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => handleProfile(navigation)}
                      >
                        <Text style={styles.menuText}>Перейти в профіль</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => handleLogout(navigation)}
                      >
                        <Text style={styles.menuText_Exit}>Вийти з акаунту</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Modal>
              </>
            ),
          })}
        />
       <Stack.Screen
                 name="Profile"
                 component={Profile}
                 options={({ navigation }) => ({
                   title: "Мій профіль",
                   headerRight: () => (
                     <TouchableOpacity
                       style={{ marginRight: 16 }}
                       onPress={() => handleLogout(navigation)}
                     >
                       <Text style={{ color: "#FF0000" }}>Вийти</Text>
                     </TouchableOpacity>
                   ),
                 })}
               />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  menu: {
    backgroundColor: "#fff",
    marginTop: 60,
    marginRight: 16,
    borderRadius: 8,
    padding: 8,
    elevation: 5,
  },
  menuItem: {
    padding: 12,
  },
  menuText: {
    fontSize: 16,
    color: "#000",
  },
  menuText_Exit: {
      fontSize: 16,
      color: "#000",
      color: "#FF0000"
    },
});