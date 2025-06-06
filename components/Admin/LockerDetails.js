import React, { useEffect, useState } from "react";
import {View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Modal, TextInput } from "react-native";
import { Button, Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute } from "@react-navigation/native";
import { authApis, endpoints } from "../../configs/Apis";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

const statusTrans = {
  waiting: "Chờ nhận",
  received: "Đã nhận",
};

const LockerDetails = () => {
  const [locker, setLocker] = useState(null);
  const [resident, setResident] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemName, setItemName] = useState("");
  const [itemStatus, setItemStatus] = useState("waiting");
  const route = useRoute();
  const { lockerId } = route.params;
  const [showReceived, setShowReceived] = useState(false);

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

      detailItems.sort((a, b) => {
        if (a.status === "waiting" && b.status !== "waiting") return -1;
        if (a.status !== "waiting" && b.status === "waiting") return 1;
        return 0;
      });
      setItems(detailItems);
    } catch (err) {
      console.error("Lỗi khi tải chi tiết tủ đồ:", err);
      Alert.alert("Lỗi", "Không thể tải dữ liệu chi tiết.");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setItemName("");
    setItemStatus("waiting");
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemStatus(item.status);
    setModalVisible(true);
  };

  const handleSave = async () => {
    const token = await AsyncStorage.getItem("token");
    const formData = new FormData();
    if(itemName) {
      formData.append("name_item", itemName);
    }

    if(itemStatus) {
      formData.append("status", itemStatus);
    }

    try {
      if (editingItem) {
        await authApis(token).patch(`/lockeritems/${lockerId}/item/${editingItem.id}/`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        await authApis(token).post(`/lockeritems/${lockerId}/item/`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      setModalVisible(false);
      loadLockerDetails();
    } catch (err) {
      console.error("Lỗi khi lưu:", err);
      Alert.alert("Lỗi", "Không thể lưu dữ liệu.");
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
            {items.filter(i => i.status === "waiting").length > 0 ? (
              items.filter(i => i.status === "waiting").map((i) => (
                <View key={i.id} style={styles.itemBox}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View>
                      <Text style={styles.detail}>🔹📦 {i.name}</Text>
                      <Text style={styles.detail}>Trạng thái: {statusTrans[i.status]}</Text>
                    </View>
                    <TouchableOpacity onPress={() => openEditModal(i)}>
                      <Ionicons name="create-outline" size={22} color="#2980b9" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.detail}>Không có món đồ đang chờ nhận.</Text>
            )}

            <TouchableOpacity onPress={() => setShowReceived(!showReceived)} style={{ marginTop: 16, flexDirection: "row", alignItems: "center" }}>
              <Ionicons name={showReceived ? "chevron-down" : "chevron-forward"} size={18} color="#333" />
              <Text style={[styles.title, { fontSize: 18, marginLeft: 5 }]}>Món đồ đã nhận</Text>
            </TouchableOpacity>

            {showReceived && items.filter(i => i.status === "received").length > 0 ? (
              items.filter(i => i.status === "received").map((i) => (
                <View key={i.id} style={styles.itemBox}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View>
                      <Text style={styles.detail}>📦 {i.name}</Text>
                      <Text style={styles.detail}>Trạng thái: {statusTrans[i.status]}</Text>
                    </View>
                    <TouchableOpacity onPress={() => openEditModal(i)}>
                      <Ionicons name="create-outline" size={22} color="#2980b9" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : showReceived ? (
              <Text style={styles.detail}>Không có món đồ đã nhận.</Text>
            ) : null}
        </Card.Content>
      </Card>

      <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addText}>Thêm món đồ</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            
            <Text style={styles.title}>{editingItem ? "Chỉnh sửa món đồ" : "Thêm món đồ"}</Text>
            <TextInput
              style={styles.input}
              placeholder="Tên món đồ"
              value={itemName}
              onChangeText={setItemName}
            />
            <View style={styles.pickerContainer}>
              <Text style={{ fontSize: 16, marginBottom: 4 }}>Trạng thái</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={itemStatus}
                  onValueChange={(value) => setItemStatus(value)}
                >
                  <Picker.Item label="Chờ nhận" value="waiting" />
                  <Picker.Item label="Đã nhận" value="received" />
                </Picker>
              </View>
            </View>
            <View style={styles.modalButtons}>
              <Button style={styles.saveButton} onPress={handleSave} labelStyle={{ color: "#fff", fontSize: 16 }}>
                Lưu
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
  addButton: {
    backgroundColor: "#2ecc71",
    position: "absolute",
    bottom: 20,
    right: 20,
    padding: 10,
    borderRadius: 50,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  addText: {
    color: "#fff",
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
  },
    modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  saveButton: {
    flex: 1,
    marginTop: 10,
    backgroundColor: "#27ae60",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 5,
  },
});

export default LockerDetails;
