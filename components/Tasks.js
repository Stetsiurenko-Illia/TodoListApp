import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Svg, Path } from "react-native-svg";
import api from "../api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EditTaskModal from "./EditTaskModal";
import ShareTaskModal from "./ShareTaskModal";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [sharedTasks, setSharedTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [sharingTaskId, setSharingTaskId] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await api.get("api/tasks/");
        console.log("Завантажені особисті задачі:", response.data);
        setTasks(response.data);
        setLoading(false);
      } catch (err) {
        setError("Не вдалося завантажити завдання: " + err.message);
        setLoading(false);
        console.error("Помилка завантаження особистих задач:", err);
      }
    };

    const fetchSharedTasks = async () => {
      try {
        const response = await api.get("api/shared-tasks/");
        console.log("Завантажені поширені задачі через API:", response.data);
        setSharedTasks(response.data);
        AsyncStorage.setItem("sharedTasks", JSON.stringify(response.data)).catch(
          (err) => console.error("Помилка збереження sharedTasks:", err)
        );
      } catch (err) {
        setError("Не вдалося завантажити спільні завдання: " + err.message);
        console.error("Помилка завантаження спільних задач:", err);
      }
    };

    const loadSharedTasks = async () => {
      try {
        const storedSharedTasks = await AsyncStorage.getItem("sharedTasks");
        if (storedSharedTasks) {
          console.log("Завантажено sharedTasks з AsyncStorage:", JSON.parse(storedSharedTasks));
          setSharedTasks(JSON.parse(storedSharedTasks));
        }
      } catch (err) {
        console.error("Помилка завантаження sharedTasks з AsyncStorage:", err);
      }
    };

    fetchTasks();
    loadSharedTasks();
    fetchSharedTasks();

    const setupWebSocket = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (token) {
          const ws = new WebSocket(
            `wss://web-app-backend-m6hf.onrender.com/ws/tasks/?token=${token}`
          );

          ws.onopen = () => {
            console.log("WebSocket для завдань підключено");
          };

          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Отримано WebSocket повідомлення:", data);

            if (data.action === "create_task") {
              const newTask = data.task;
              setTasks((prev) => [...prev, newTask]);
            } else if (data.action === "update_task") {
              const updatedTask = data.task;
              setTasks((prev) =>
                prev.map((task) =>
                  task.id === updatedTask.id ? updatedTask : task
                )
              );
              setSharedTasks((prev) =>
                prev.map((task) =>
                  task.id === updatedTask.id ? updatedTask : task
                )
              );
            } else if (data.action === "delete_task") {
              const taskId = data.task_id;
              setTasks((prev) => prev.filter((task) => task.id !== taskId));
              setSharedTasks((prev) =>
                prev.filter((task) => task.id !== taskId)
              );
            } else if (data.action === "share_task") {
              const sharedTask = data.task;
              console.log("Отримано поширену задачу через WebSocket:", sharedTask);
              setSharedTasks((prev) => {
                if (!prev.some((task) => task.id === sharedTask.id)) {
                  const newSharedTasks = [
                    ...prev,
                    { ...sharedTask, shared_by: sharedTask.user },
                  ];
                  AsyncStorage.setItem(
                    "sharedTasks",
                    JSON.stringify(newSharedTasks)
                  ).catch((err) =>
                    console.error("Помилка збереження sharedTasks:", err)
                  );
                  return newSharedTasks;
                }
                return prev;
              });
            }
          };

          ws.onclose = () => {
            setError("WebSocket відключено");
            console.log("WebSocket закрито");
            setSocket(null);
          };

          ws.onerror = () => {
            setError("Помилка WebSocket");
            console.error("Помилка WebSocket");
            setSocket(null);
          };

          setSocket(ws);
          return () => ws.close();
        } else {
          console.error("Токен авторизації не знайдено в AsyncStorage");
        }
      } catch (err) {
        console.error("Помилка отримання токена для WebSocket:", err);
        setError("Не вдалося підключитися до WebSocket");
      }
    };

    setupWebSocket();
  }, []);

  const handleAddTask = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Заголовок та опис не можуть бути порожніми");
      return;
    }
    try {
      setError("");
      console.log("Надсилаю POST-запит для створення задачі:", {
        title,
        description,
      });
      const response = await api.post("api/tasks/", {
        title,
        description,
        completed: false,
      });
      console.log("Відповідь на створення задачі:", response.data);
      setTasks([...tasks, response.data]);
      setTitle("");
      setDescription("");
    } catch (err) {
      console.error("Помилка створення задачі:", err.response || err);
      setError(
        "Не вдалося додати завдання: " + (err.response?.status || err.message)
      );
    }
  };

  const handleToggleComplete = async (taskId, currentStatus) => {
    try {
      console.log(`Оновлення статусу задачі ${taskId}: ${currentStatus} -> ${!currentStatus}`);
      const response = await api.put(`api/tasks/${taskId}/`, {
        completed: !currentStatus,
      });

      setTasks(
        tasks.map((task) =>
          task.id === taskId
            ? { ...task, completed: response.data.completed }
            : task
        )
      );

      if (socket && socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(
            JSON.stringify({
              action: "update_task",
              task: {
                id: taskId,
                completed: response.data.completed,
              },
            })
          );
          console.log("WebSocket повідомлення надіслано:", {
            action: "update_task",
            task: { id: taskId, completed: response.data.completed },
          });
        } catch (wsError) {
          console.error("Помилка відправки WebSocket-повідомлення:", wsError);
          setError("Не вдалося синхронізувати зміни через WebSocket");
        }
      } else {
        console.warn("WebSocket не підключений або закритий");
        setError("WebSocket не підключений, синхронізація недоступна");
      }
    } catch (err) {
      console.error("Помилка оновлення статусу:", err.response || err);
      setError(
        "Не вдалося оновити статус задачі: " +
          (err.response?.status || err.message || err)
      );
    }
  };

  const handleEdit = (taskId) => {
    setEditingTaskId(taskId);
  };

  const handleSaveEdit = (taskId, updatedTask) => {
    console.log(`Оновлення задачі ${taskId} у вкладці ${activeTab}:`, updatedTask);
    if (activeTab === "personal") {
      setTasks(
        tasks.map((task) => (task.id === taskId ? { ...task, ...updatedTask } : task))
      );
    }
    setEditingTaskId(null);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      setError("");
      const endpoint = `api/tasks/${taskId}/`;
      await api.delete(endpoint);
      setTasks(tasks.filter((task) => task.id !== taskId));
    } catch (err) {
      console.error("Помилка видалення:", err);
      setError("Не вдалося видалити задачу");
    }
  };

  const handleShareTask = (taskId, email) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message = {
        action: "share_task",
        task_id: taskId,
        email: email,
      };
      console.log("Надсилаю WebSocket повідомлення для поширення:", message);
      socket.send(JSON.stringify(message));
      setSharingTaskId(null);
    } else {
      setError("WebSocket не підключений");
      console.error("WebSocket не підключений для надсилання share_task");
    }
  };

  const handleCancelShare = () => {
    setSharingTaskId(null);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Завантаження...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Видалили header, оскільки він тепер у навігації */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "personal" && styles.activeTab]}
          onPress={() => setActiveTab("personal")}
        >
          <Text style={styles.tabText}>Мої завдання</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "shared" && styles.activeTab]}
          onPress={() => setActiveTab("shared")}
        >
          <Text style={styles.tabText}>Поширені завдання</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "personal" ? (
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TextInput
            style={styles.input}
            placeholder="Заголовок"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Опис"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <TouchableOpacity style={styles.singleButton} onPress={handleAddTask}>
            <Text style={styles.buttonText}>Додати</Text>
          </TouchableOpacity>
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.task}>
                <View style={styles.taskHeader}>
                  <View style={styles.taskTitleContainer}>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => {
                        console.log("item.id:", item.id, "item.completed:", item.completed);
                        handleToggleComplete(item.id, item.completed);
                      }}
                    >
                      {item.completed ? (
                        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.11 3.89 21 5 21H19C20.11 21 21 20.11 21 19V5C21 3.89 20.11 3 19 3ZM10 16.5L5.5 12L7.41 10.09L10 12.67L16.59 6.09L18.5 8L10 16.5Z"
                            fill="#007BFF"
                          />
                        </Svg>
                      ) : (
                        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.11 3.89 21 5 21H19C20.11 21 21 20.11 21 19V5C21 3.89 20.11 3 19 3Z"
                            stroke="#000"
                            strokeWidth="2"
                          />
                        </Svg>
                      )}
                    </TouchableOpacity>
                    <Text
                      style={item.completed ? styles.completed : styles.taskTitle}
                    >
                      {item.title}
                    </Text>
                  </View>
                  <View style={styles.taskActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEdit(item.id)}
                    >
                      <Svg width="16" height="16" fill="#FFC107" viewBox="0 0 16 16">
                        <Path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                      </Svg>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteTask(item.id)}
                    >
                      <Svg width="16" height="16" fill="#DC3545" viewBox="0 0 16 16">
                        <Path d="M5.5 5.5A.5.5 0 0 1 6 5v6a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V5z" />
                        <Path
                          fillRule="evenodd"
                          d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a.5.5 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                        />
                      </Svg>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => setSharingTaskId(item.id)}
                    >
                      <Svg width="16" height="16" fill="#007BFF" viewBox="0 0 16 16">
                        <Path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a.5.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5m-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3" />
                      </Svg>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text>{item.description}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>Немає задач</Text>}
          />
        </>
      ) : (
        <View style={styles.sharedContainer}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <FlatList
            data={sharedTasks}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.task}>
                <View style={styles.taskHeader}>
                  <View style={styles.taskTitleContainer}>
                    <Text
                      style={item.completed ? styles.completed : styles.taskTitle}
                    >
                      {item.title} {item.shared_by ? `(від ${item.shared_by})` : ""}
                    </Text>
                  </View>
                </View>
                <Text>{item.description}</Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>Немає спільних задач</Text>
            }
          />
        </View>
      )}

      {editingTaskId && (
        <EditTaskModal
          taskId={editingTaskId}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      )}

      {sharingTaskId && (
        <ShareTaskModal
          taskId={sharingTaskId}
          onShare={handleShareTask}
          onCancel={handleCancelShare}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  sharedContainer: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  tab: {
    padding: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#007BFF",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
  },
  singleButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
    alignSelf: "center",
    width: 200,
    marginBottom: 16,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  task: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#ccc" },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  taskTitle: { fontSize: 18, fontWeight: "bold" },
  completed: {
    fontSize: 18,
    textDecorationLine: "line-through",
    color: "#888",
  },
  taskActions: { flexDirection: "row", alignItems: "center" },
  actionButton: { marginHorizontal: 8 },
  error: { color: "red", marginBottom: 8 },
  empty: { textAlign: "center", marginTop: 16 },
  checkbox: { marginRight: 8 },
});