import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { Avatar, Card } from "react-native-paper";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";

const quanHeVietHoa = {
  "owner": "Chủ hộ",
  "wife/husband": "Vợ/Chồng",
  "child": "Con cái",
  "other": "Khác"
};

const ResidentDetails = ({ route }) => {
  const { residentId } = route.params;
  const [resident, setResident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [error, setError] = useState(null);

  const loadResidentDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).get(`${endpoints["residents"]}${residentId}/`);
      setResident(res.data);
      
    //   const userRes = await authApis(token).get(`${endpoints["users"]}`);
    //   const user = userRes.data.find(u => u.resident && u.resident.id === residentId);

    //   if (user) {
    //     setAccount(user);
    //   }

    } catch (err) {
      console.error("Lỗi khi tải thông tin cư dân:", err);
      setError("Không thể tải thông tin cư dân. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResidentDetails();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title
          title={resident.name}
          subtitle={`👤 Quan hệ: ${quanHeVietHoa[resident.relationship_to_head] || "Không rõ"}`}
          left={(props) => <Avatar.Text {...props} label={resident.name[0].toUpperCase()} />}
        />
        <Card.Content>
          <Text>🏠 Phòng: {resident.apartment?.number || "Không rõ"}</Text>
        </Card.Content>
      </Card>

      {/* {account && (
        <Card style={styles.card}>
          <Card.Title title="Tài khoản người dùng" />
          <Card.Content>
            <Text>👤 Username: {account.username}</Text>
            <Text>📧 Email: {account.email || "Không có"}</Text>
            <Text>🛡️ Vai trò: {"Người dùng thường"}</Text>
          </Card.Content>
        </Card>
      )} */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  card: {
    marginBottom: 20,
    borderRadius: 10,
    elevation: 3,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
});

export default ResidentDetails;
