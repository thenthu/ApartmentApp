import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Alert, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { Card, Button, TextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { TouchableWithoutFeedback } from "react-native";
import RNPickerSelect from "react-native-picker-select";

const Lockers = () => {
  const [lockers, setLockers] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState(null);
  const [lockerNumber, setLockerNumber] = useState("");
  const [selectedResident, setSelectedResident] = useState(null);
  const [selectedItem, setSelectedItem] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;
  const navigation = useNavigation();

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const [lockerRes, residentRes] = await Promise.all([
        authApis(token).get(endpoints.lockeritems),
        authApis(token).get(endpoints.residents),
      ]);

      setResidents(residentRes.data);
      const residentMap = residentRes.data.reduce((acc, res) => {
        acc[res.id] = res;
        return acc;
      }, {});

      const enrichedLockers = lockerRes.data.map((locker) => ({
        ...locker,
        resident_name: residentMap[locker.resident]?.name,
        item_names: locker.items.map((item) => item.name_item),
      }));

      enrichedLockers.sort((a, b) => parseInt(a.locker_number) - parseInt(b.locker_number));

      setLockers(enrichedLockers);
      setTotalPages(Math.ceil(enrichedLockers.length / itemsPerPage));
    } catch (err) {
      console.error("Lỗi khi tải tủ đồ:", err);
      Alert.alert("Lỗi", "Không thể lấy dữ liệu tủ đồ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (lockerId) => {
    Alert.alert(
      "Xoá tủ đồ",
      "Bạn có chắc chắn muốn xoá tủ đồ này?",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              await authApis(token).delete(`${endpoints.lockeritems}/${lockerId}`);
              setLockers((prev) => prev.filter((l) => l.id !== lockerId));
            } catch (err) {
              console.error("Xoá lỗi:", err);
              Alert.alert("Lỗi", "Không thể xoá tủ đồ.");
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleSave = async () => {

    try {
      const token = await AsyncStorage.getItem("token");
      const formData = new FormData();

      formData.append("locker_number", lockerNumber);
      if(selectedResident) {
        formData.append("resident", selectedResident);
      }

      if (selectedItem) {
        formData.append("items[]", selectedItem);
      }

      if (isEditing && selectedLocker) {
        await authApis(token).patch(`${endpoints.lockeritems}/${selectedLocker.id}/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        Alert.alert("Thông báo", "Cập nhật tủ đồ thành công.");
        loadData();
      } else {
          if (!lockerNumber || !selectedResident) {
            Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin tủ đồ.");
            return;
          }
          
        await authApis(token).post(endpoints.lockeritems, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        Alert.alert("Thông báo", "Thêm tủ đồ thành công.");
      }

      setAddModalVisible(false);
      loadData();
    } catch (err) {
      console.error("Lỗi khi thêm hoặc chỉnh sửa tủ đồ:", err);
      Alert.alert("Lỗi", "Không thể lưu tủ đồ.");
    }
  };

  const renderLockerItem = ({ item }) => (
    <TouchableWithoutFeedback key={item.id} onPress={() => navigation.navigate("LockerDetails", { lockerId: item.id })}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Tủ số {item.locker_number}</Text>
          <Text style={styles.detail}>Cư dân: {item.resident_name}</Text>
          <Text style={styles.detail}>
            Vật phẩm: {item.item_names.length > 0 ? item.item_names.join(", ") : "Không có"}
          </Text>
        </Card.Content>
        <Card.Actions style={styles.buttonGroup}>
          <Button
            icon="pencil"
            mode="contained"
            style={styles.editButton}
            onPress={() => {
              setSelectedLocker(item);
              setIsEditing(true);
              setLockerNumber(item.locker_number);
              setSelectedResident(item.resident ? item.resident.id : null);
              setSelectedItem(item.item_names.length > 0 ? item.item_names[0] : "");
              setAddModalVisible(true);
            }}
          >
            Chỉnh sửa
          </Button>
          <Button
            icon="delete"
            mode="contained"
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
          >
            Xoá
          </Button>
        </Card.Actions>
      </Card>
    </TouchableWithoutFeedback>
  );

  if (loading) {
    return <Text style={{ padding: 20 }}>Đang tải dữ liệu...</Text>;
  }

  const lockersToDisplay = lockers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <View style={styles.container}>
      <FlatList
        data={lockersToDisplay}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderLockerItem}
        contentContainerStyle={{ padding: 16 }}
        ListFooterComponent={
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              onPress={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={[styles.pageButton, { opacity: currentPage === 1 ? 0.5 : 1 }]}
            >
              <Ionicons name="chevron-back-outline" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.pageInfo}>{currentPage} / {totalPages}</Text>
            <TouchableOpacity
              onPress={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={[styles.pageButton, { opacity: currentPage === totalPages ? 0.5 : 1 }]}
            >
              <Ionicons name="chevron-forward-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        }
      />

      <Modal visible={addModalVisible} animationType="slide" transparent={true} onRequestClose={() => setAddModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{isEditing ? "Chỉnh sửa Tủ đồ" : "Thêm Tủ đồ"}</Text>

            <TextInput
              label="Số tủ"
              value={lockerNumber}
              onChangeText={setLockerNumber}
              style={styles.input}
            />

            <RNPickerSelect
              onValueChange={(value) => setSelectedResident(value)}
              items={residents.map((resident) => ({
                label: resident.name,
                value: resident.id,
              }))}
              placeholder={{
                label: "Chọn cư dân",
                value: null,
              }}
              style={pickerSelectStyles}
            />

            <Button mode="contained" onPress={handleSave} style={styles.saveButton}>
              Lưu
            </Button>
            <TouchableOpacity style={styles.closeButton} onPress={() => setAddModalVisible(false)}>
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.addButton} onPress={() => {
        setIsEditing(false);
        setAddModalVisible(true);
        setLockerNumber("");
        setSelectedResident(null);
        setSelectedItem("");
      }}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addText}>Thêm Tủ Đồ</Text>
      </TouchableOpacity>
    </View>
  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
    marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
    marginBottom: 10,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  card: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  detail: {
    fontSize: 16,
    color: "#555",
    marginTop: 4,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  editButton: {
    backgroundColor: "#3498db",
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  input: {
    marginBottom: 10,
  },
  saveButton: {
    marginTop: 10,
    backgroundColor: "#27ae60",
  },
  closeButton: {
    marginTop: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#3498db",
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
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  pageButton: {
    backgroundColor: "#4a90e2",
    padding: 8,
    borderRadius: 5,
  },
  pageInfo: {
    marginHorizontal: 12,
    fontSize: 16,
    color: "#333",
  },
});

export default Lockers;
