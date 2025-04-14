import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  Pressable,
} from "react-native";
import api from "../api";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function Profile() {
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    gender: "",
    birth_date: "",
    avatar: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const BASE_URL = "https://web-app-backend-m6hf.onrender.com";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("api/profile/");
        setProfile(response.data);
        setLoading(false);
      } catch (err) {
        setError("Не вдалося завантажити профіль");
        setLoading(false);
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (name, value) => {
    setProfile({ ...profile, [name]: value });
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0]; // Формат РРРР-ММ-ДД
      handleInputChange("birth_date", formattedDate);
    }
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("username", profile.username);
      formData.append("email", profile.email);
      formData.append("gender", profile.gender);
      formData.append("birth_date", profile.birth_date);
      if (avatarFile) formData.append("avatar", avatarFile);

      const response = await api.put("api/profile/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setProfile(response.data);
      setAvatarFile(null);
      setEditMode(false);
    } catch (err) {
      setError("Не вдалося оновити профіль");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Завантаження...</Text>
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
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={{
            uri: profile.avatar
              ? `${BASE_URL}${profile.avatar}?t=${new Date().getTime()}`
              : "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
          }}
          style={styles.avatar}
        />
        {editMode ? (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Ім’я користувача"
              value={profile.username}
              onChangeText={(text) => handleInputChange("username", text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={profile.email}
              onChangeText={(text) => handleInputChange("email", text)}
              keyboardType="email-address"
            />
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={profile.gender}
                onValueChange={(itemValue) =>
                  handleInputChange("gender", itemValue)
                }
                style={styles.picker}
              >
                <Picker.Item label="Оберіть стать" value="O" />
                <Picker.Item label="Чоловік" value="M" />
                <Picker.Item label="Жінка" value="F" />
                <Picker.Item label="Інше" value="O" />
              </Picker>
            </View>
            <Pressable
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.datePickerText}>
                {profile.birth_date || "Оберіть дату народження"}
              </Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={
                  profile.birth_date
                    ? new Date(profile.birth_date)
                    : new Date()
                }
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
                maximumDate={new Date()} // Не дозволяємо вибирати майбутні дати
              />
            )}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.button} onPress={handleSave}>
                <Text style={styles.buttonText}>Зберегти</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditMode(false)}
              >
                <Text style={styles.buttonText}>Скасувати</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.info}>
            <View style={styles.infoContent}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Ім’я користувача:</Text>
                <Text style={styles.value}>{profile.username}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{profile.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Стать:</Text>
                <Text style={styles.value}>
                  {profile.gender === "M"
                    ? "Чоловік"
                    : profile.gender === "F"
                    ? "Жінка"
                    : "Інше"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Дата народження:</Text>
                <Text style={styles.value}>{profile.birth_date}</Text>
              </View>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => setEditMode(true)}
              >
                <Text style={styles.buttonText}>Редагувати</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 24,
  },
  form: {
    width: "100%",
  },
  info: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoContent: {
    alignItems: "flex-start",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginRight: 8,
  },
  value: {
    fontSize: 18,
    color: "#333",
  },
  buttonContainer: {
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 16,
    borderRadius: 6,
    width: "100%",
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginBottom: 16,
    width: "100%",
  },
  picker: {
    height: 50,
    width: "100%",
    fontSize: 16,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    width: "100%",
  },
  datePickerText: {
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: "center",
    marginVertical: 8,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: "#6c757d",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: "center",
    marginVertical: 8,
    marginHorizontal: 4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
  },
  error: {
    color: "red",
    fontSize: 18,
  },
  loadingText: {
    fontSize: 18,
    color: "#333",
  },
});