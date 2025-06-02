import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { MyUserContext } from "../../configs/Contexts";
import { authApis } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MyComplaints = () => {
  const user = useContext(MyUserContext);
  const residentId = user.resident?.id;

  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMyComplaints = async () => {
    if (!description.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập nội dung phản ánh.");
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await authApis(token).post("/feedbacks/", {
        resident_id: residentId,
        description: description,
      });

      if (response.status === 201) {
        Alert.alert("Thành công", "Phản ánh đã được gửi thành công.");
        setDescription("");
      } else {
        Alert.alert("Lỗi", "Đã xảy ra lỗi khi gửi phản ánh. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi khi gửi phản ánh:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi gửi phản ánh. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gửi Phản Ánh</Text>

      <TextInput
        style={styles.input}
        multiline
        numberOfLines={4}
        placeholder="Nhập phản ánh của bạn ở đây"
        value={description}
        onChangeText={setDescription}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleMyComplaints}>
          <Text style={styles.buttonText}>Gửi Phản Ánh</Text>
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
    marginBottom: 20,
    textAlignVertical: "top",
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

export default MyComplaints;
