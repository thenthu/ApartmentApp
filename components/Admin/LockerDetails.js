import React, { useEffect, useState } from "react";
import {View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute } from "@react-navigation/native";
import { authApis, endpoints } from "../../configs/Apis";
import { Ionicons } from "@expo/vector-icons";

const statusTrans = {
  waiting: "Chờ nhận",
  received: "Đã nhận",
};

const LockerDetails = () => {
  const [locker, setLocker] = useState(null);
  const [resident, setResident] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const route = useRoute();
  const { lockerId } = route.params;

  const loadLockerDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await authApis(token).get(`${endpoints.lockeritems}/${lockerId}/`);
      const lockerData = res.data;
      setLocker(lockerData);

      const residentRes = await authApis(token).get(`${endpoints.residents}/${lockerData.resident}/`);
      setResident(residentRes.data);

      const statusPromises = lockerData.items.map(async (item) => {
        const itemStatusRes = await authApis(token).get(
          `/residents/${lockerData.resident}/lockeritem/item/${item.id}`
        );
        return {
          id: item.id,
          name: item.name_item,
          status: itemStatusRes.data.status,
        };
      });

      const detailItems = await Promise.all(statusPromises);
      setItems(detailItems);
    } catch (err) {
      console.error("Lỗi khi tải chi tiết tủ đồ:", err);
      Alert.alert("Lỗi", "Không thể tải dữ liệu chi tiết.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLockerDetails();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={{ marginTop: 10 }}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (!locker) {
    return (
      <View style={styles.centered}>
        <Text>Không tìm thấy thông tin tủ đồ.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Tủ số {locker.locker_number}</Text>
          <Text style={styles.detail}>Mã tủ: {locker.id}</Text>
          <Text style={styles.detail}>Cư dân: {resident?.name || "Không rõ"}</Text>

          <Text style={[styles.title, { marginTop: 12 }]}>Danh sách món đồ:</Text>
          {items.length > 0 ? (
            items.map((i) => (
              <View key={i.id} style={styles.itemBox}>
                <Text style={styles.detail}>🔹📦 {i.name}</Text>
                <Text style={styles.detail}> Trạng thái: {statusTrans[i.status]}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.detail}>Không có món đồ nào.</Text>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    padding: 16,
  },
  card: {
    padding: 10,
    borderRadius: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 4,
    color: "#2c3e50",
  },
  detail: {
    fontSize: 16,
    marginVertical: 2,
    color: "#333",
  },
  itemBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#ecf0f1",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default LockerDetails;
