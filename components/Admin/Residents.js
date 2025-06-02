import React, { useState, useEffect } from "react";
import {View, Text, TextInput, Modal, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, TouchableWithoutFeedback, } from "react-native";
import { Card, Avatar, Button } from "react-native-paper";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import RNPickerSelect from "react-native-picker-select";

const quanHeVietHoa = {
  owner: "Chủ hộ",
  "wife/husband": "Vợ/Chồng",
  child: "Con cái",
  other: "Khác",
};

const Residents = () => {
  const [groupedResidents, setGroupedResidents] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const roomsPerPage = 3;
  const navigation = useNavigation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [residentData, setResidentData] = useState({ name: "", relationship_to_head: "", room: "" });
  const [newResidentData, setNewResidentData] = useState({ name: "", relationship_to_head: "", room: "" });
  const [residentId, setResidentId] = useState(null);
  const [apartments, setApartments] = useState([]);

  const sortRooms = (rooms) => {
    return rooms.sort((a, b) => {
      const regex = /([a-zA-Z]*)(\d+)/;
      const matchA = a.match(regex);
      const matchB = b.match(regex);
      const letterA = matchA ? matchA[1] : "";
      const letterB = matchB ? matchB[1] : "";
      const numberA = matchA ? parseInt(matchA[2]) : 0;
      const numberB = matchB ? parseInt(matchB[2]) : 0;
      if (letterA < letterB) return -1;
      if (letterA > letterB) return 1;
      return numberA - numberB;
    });
  };

  const groupResidentsByRoom = (residents) => {
    const grouped = {};
    for (let r of residents) {
      const room = r.apartment?.number || "Không xác định";
      if (!grouped[room]) grouped[room] = [];
      grouped[room].push(r);
    }
    return grouped;
  };

  const loadResidents = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).get(endpoints.residents);
      const users = await authApis(token).get(endpoints.users);
      const usersData = users.data.reduce((acc, user) => {
        acc[user.resident?.id] = user;
        return acc;
      }, {});
      const residentsWithUser = res.data.map((resident) => ({
        ...resident,
        user: usersData[resident.id] || null,
      }));
      setGroupedResidents(groupResidentsByRoom(residentsWithUser));
    } catch (err) {
      console.error("Lỗi khi tải cư dân:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadApartments = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).get(endpoints.apartments);
      setApartments(res.data.results);
    } catch (err) {
      console.error("Lỗi khi tải danh sách phòng:", err);
    }
  };

  useEffect(() => {
    loadResidents();
    loadApartments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadResidents();
  };

  const handleEdit = (resident) => {
    setResidentData({
      name: resident.name,
      relationship_to_head: resident.relationship_to_head,
      room: resident.apartment?.number || "",
    });
    setResidentId(resident.id);
    setIsEditing(true);
    setIsModalVisible(true);
  };

  const handleAddResident = () => {
    setNewResidentData({ name: "", relationship_to_head: "", room: "" });
    setIsEditing(false);
    setIsModalVisible(true);
  };

  const handleSaveResident = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const formData = new FormData();
      const data = isEditing ? residentData : newResidentData;
      formData.append("name", data.name);
      formData.append("relationship_to_head", data.relationship_to_head);
      formData.append("apartment", data.room);

      if (isEditing && residentId) {
        await authApis(token).patch(`/residents/${residentId}/`, formData, {
          headers: {
            "Content-Type": "multipart/form-data" 
          },
        });
      } else {
        await authApis(token).post(endpoints.residents, formData, {
          headers: { 
            "Content-Type": "multipart/form-data" 
          },
        });
      }

      setIsModalVisible(false);
      loadResidents();
    } catch (err) {
      console.error("Lỗi khi lưu cư dân:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await authApis(token).delete(`/residents/${id}/`);
      loadResidents();
    } catch (err) {
      console.error("Lỗi khi xoá cư dân:", err);
    }
  };

  const renderResident = (resident) => (
    <TouchableWithoutFeedback key={resident.id} onPress={() => navigation.navigate("ResidentDetails", { residentId: resident.id })}>
      <Card style={styles.card}>
        <Card.Title
          title={resident.name}
          subtitle={`👤 ${quanHeVietHoa[resident.relationship_to_head] ?? "Không rõ"}`}
          left={(props) => <Avatar.Text {...props} label={resident.name.charAt(0).toUpperCase()} />}
          right={() => resident.user ? <Avatar.Image source={{ uri: resident.user.avatar }} size={40} /> : null}
        />
        {resident.user && (
          <View style={styles.userInfoContainer}>
            <Text style={styles.username}>{resident.user.username}</Text>
            <Text style={styles.userFullName}>{`${resident.user.first_name} ${resident.user.last_name}`}</Text>
          </View>
        )}
        <Card.Actions style={styles.buttonGroup}>
          <Button icon="pencil" mode="contained" style={styles.editButton} onPress={() => handleEdit(resident)}>Chỉnh sửa</Button>
          <Button icon="delete" mode="contained" style={styles.deleteButton} onPress={() => handleDelete(resident.id)}>Xoá</Button>
        </Card.Actions>
      </Card>
    </TouchableWithoutFeedback>
  );

  const renderRoomItem = ({ item: room }) => (
    <View style={styles.roomContainer}>
      <Text style={styles.roomTitle}>Phòng {room}</Text>
      {groupedResidents[room].map(renderResident)}
    </View>
  );

  const getPagedRooms = () => {
    const rooms = Object.keys(groupedResidents);
    const sortedRooms = sortRooms(rooms);
    const startIndex = (currentPage - 1) * roomsPerPage;
    const endIndex = currentPage * roomsPerPage;
    return sortedRooms.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(Object.keys(groupedResidents).length / roomsPerPage);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#4a90e2" />
      ) : (
        <FlatList
          data={getPagedRooms()}
          keyExtractor={(room) => room}
          renderItem={renderRoomItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
      )}

      <TouchableOpacity style={styles.addButton} onPress={handleAddResident}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addText}>Thêm Cư Dân</Text>
      </TouchableOpacity>

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>{isEditing ? "Chỉnh sửa cư dân" : "Thêm cư dân mới"}</Text>

            <TextInput
              style={styles.input}
              placeholder="Tên cư dân"
              value={isEditing ? residentData.name : newResidentData.name}
              onChangeText={(text) =>
                isEditing
                  ? setResidentData({ ...residentData, name: text })
                  : setNewResidentData({ ...newResidentData, name: text })
              }
            />

            <RNPickerSelect
              onValueChange={(value) =>
                isEditing
                  ? setResidentData({ ...residentData, relationship_to_head: value })
                  : setNewResidentData({ ...newResidentData, relationship_to_head: value })
              }
              items={[
                { label: 'Chủ hộ', value: 'owner' },
                { label: 'Vợ/Chồng', value: 'wife/husband' },
                { label: 'Con cái', value: 'child' },
                { label: 'Khác', value: 'other' },
              ]}
              value={isEditing ? residentData.relationship_to_head : newResidentData.relationship_to_head}
              style={pickerSelectStyles}
              placeholder={{ label: 'Chọn mối quan hệ...', value: null }}
            />

            <RNPickerSelect
              onValueChange={(value) =>
                isEditing
                  ? setResidentData({ ...residentData, room: value })
                  : setNewResidentData({ ...newResidentData, room: value })
              }
              items={apartments.map((apartment) => ({
                label: apartment.number,
                value: apartment.number,
              }))}
              value={isEditing ? residentData.room : newResidentData.room}
              style={pickerSelectStyles}
              placeholder={{ label: 'Chọn phòng...', value: null }}
            />

            <View style={styles.modalButtons}>
              <Button style={styles.saveButton} onPress={handleSaveResident}>
                Lưu
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    color: 'black',
    paddingRight: 30,
    marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    color: 'black',
    paddingRight: 30,
    marginBottom: 10,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },

  roomContainer: {
    marginBottom: 24,
  },

  roomTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },

  card: {
    marginBottom: 10,
    borderRadius: 10,
    elevation: 3,
  },

  userInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  username: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },

  userFullName: {
    fontSize: 12,
    color: "#777",
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

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
    position: "relative",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },

  input: {
    width: "100%",
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 8,
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

export default Residents;
