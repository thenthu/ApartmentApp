import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { authApis } from "../../configs/Apis";  // Đảm bảo bạn đã cấu hình authApis đúng cách
import AsyncStorage from "@react-native-async-storage/async-storage";

const CreateAccount = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [residentId, setResidentId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async () => {
    if (!username || !password || !firstName || !lastName) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin.");
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");

      const response = await authApis(token).post("/users/", {
        username,
        password,
        first_name: firstName,
        last_name: lastName,
        avatar,
        resident: residentId,  // Gắn residentId vào
      });

      if (response.status === 201) {
        Alert.alert("Thành công", "Tài khoản đã được tạo.");
        // Xử lý sau khi tạo tài khoản thành công (reset form hoặc điều hướng đến màn hình khác)
        setUsername("");
        setPassword("");
        setFirstName("");
        setLastName("");
        setAvatar("");
      } else {
        Alert.alert("Lỗi", "Không thể tạo tài khoản. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi khi tạo tài khoản:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thêm Tài Khoản</Text>

      <TextInput
        style={styles.input}
        placeholder="Tên đăng nhập"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Họ"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Tên"
        value={lastName}
        onChangeText={setLastName}
      />
      <TextInput
        style={styles.input}
        placeholder="Ảnh đại diện (URL)"
        value={avatar}
        onChangeText={setAvatar}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleCreateAccount}>
          <Text style={styles.buttonText}>Tạo Tài Khoản</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loader: {
    alignSelf: "center",
  },
});

export default CreateAccount;
