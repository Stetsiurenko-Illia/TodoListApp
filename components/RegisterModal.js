import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Svg, Path } from "react-native-svg";
import axios from "axios";

export default function RegisterModal({ onClose, onSwitchToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("Оберіть стать");
  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState("");

  const genderOptions = [
    { label: "Оберіть стать", value: "O" },
    { label: "Чоловік", value: "M" },
    { label: "Жінка", value: "F" },
    { label: "Інше", value: "O" },
  ];

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || birthDate;
    setShowDatePicker(Platform.OS === "ios");
    setBirthDate(currentDate);
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("Заповніть усі обов’язкові поля: ім’я користувача, email та пароль.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("gender", gender); // "M", "F" або "O"
      formData.append("birth_date", birthDate.toISOString().split("T")[0]); // Формат YYYY-MM-DD

      const response = await axios.post(
        "https://web-app-backend-m6hf.onrender.com/api/register/",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      console.log("Успішна реєстрація:", response.data);
      onSwitchToLogin();
    } catch (err) {
      console.error("Помилка реєстрації:", err.response?.data || err.message);
      setError(
        err.response?.data?.email?.[0] ||
        err.response?.data?.username?.[0] ||
        err.response?.data?.password?.[0] ||
        err.response?.data?.non_field_errors?.[0] ||
        "Не вдалося зареєструватися. Перевірте дані."
      );
    }
  };

  return (
    <Modal visible={true} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Реєстрація</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M6 18L18 6M6 6l12 12"
                  stroke="#000"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TextInput
            style={styles.input}
            placeholder="Ім’я користувача"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Пароль"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Стать:</Text>
            <Picker
              selectedValue={gender}
              onValueChange={(itemValue) => setGender(itemValue)}
              style={styles.picker}
            >
              {genderOptions.map((option) => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                />
              ))}
            </Picker>
          </View>
          <View style={styles.dateContainer}>
            <Text style={styles.label}>Дата народження:</Text>
            <TouchableOpacity onPress={showDatePickerModal}>
              <Text style={styles.dateText}>
                {birthDate.toISOString().split("T")[0]}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={birthDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date()} // Не дозволяємо вибирати майбутні дати
              />
            )}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.button} onPress={handleRegister}>
              <Text style={styles.buttonText}>Зареєструватися</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSwitchToLogin}>
              <Text style={styles.link}>Вже є акаунт? Увійти</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    width: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  closeButton: {
    padding: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
  },
  pickerContainer: {
    marginBottom: 8,
  },
  picker: {
    height: 50,
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
    borderColor: "#ccc",
  },
  dateContainer: {
    marginBottom: 8,
  },
  dateText: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 4,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
    marginVertical: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  link: {
    color: "#007BFF",
    textAlign: "center",
    marginVertical: 8,
  },
  actions: {
    alignItems: "center",
  },
  error: {
    color: "red",
    marginBottom: 8,
    textAlign: "center",
  },
});