import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, } from "react-native";
import { MyUserContext } from "../../configs/Contexts";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

const MyComplaints = () => {
  const user = useContext(MyUserContext);
  const residentId = user.resident?.id;
  const navigation = useNavigation();

  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMyComplaints = async () => {
    if (!title.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tiêu đề phản ánh.");
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await authApis(token).post(endpoints.complaints, {
        title: title,
      });

      if (response.status === 201) {
        Alert.alert("Thành công", "Phản ánh đã được gửi thành công.");
        setTitle("");
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
        placeholder="Nhập nội dung phản ánh"
        value={title}
        onChangeText={setTitle}
      />

      {loading ? (
        <Text style={{ padding: 20 }}>Đang tải dữ liệu...</Text>
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleMyComplaints}>
          <Text style={styles.buttonText}>Gửi Phản Ánh</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => navigation.navigate("MyComplaintHistory")}>
        <Text style={styles.historyLink}>Lịch sử phản ánh</Text>
      </TouchableOpacity>
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
  historyLink: {
    color: "#007bff",
    textAlign: "right",
    marginTop: 20,
    textDecorationLine: "underline",
    fontSize: 16,
  },
});

export default MyComplaints;
