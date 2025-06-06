import React, { useContext, useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Modal, TextInput, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Card } from "react-native-paper";
import { MyUserContext } from "../../configs/Contexts";
import { authApis, endpoints } from "../../configs/Apis";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Ionicons } from "@expo/vector-icons";

const MyVisitors = () => {
  const user = useContext(MyUserContext);
  const navigation = useNavigation();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Số lượng khách hiển thị mỗi trang

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    identity_card: "",
    phone: "",
    relationship_to_resident: "",
  });

  const loadVisitors = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const residentId = user?.resident?.id;

      if (!residentId) {
        setError("Không tìm thấy cư dân.");
        setLoading(false);
        return;
      }

      const res = await authApis(token).get(`${endpoints.residents}${residentId}/visitors/`);
      const visitorList = res.data;

      const detailedVisitors = await Promise.all(
        visitorList.map(async (visitor) => {
          try {
            const detailRes = await authApis(token).get(`${endpoints.residents}${residentId}/visitors/${visitor.id}/`);
            return detailRes.data;
          } catch (err) {
            console.error(`Lỗi khi tải chi tiết khách ${visitor.id}:`, err);
            return visitor;
          }
        })
      );

      setVisitors(detailedVisitors);
      setFilteredVisitors(detailedVisitors);
    } catch (err) {
      console.error(err);
      setError("Lỗi khi tải danh sách khách.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisitors();
  }, []);

  useEffect(() => {
    filterVisitors();
  }, [searchQuery, visitors]);

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const filterVisitors = () => {
    const filtered = visitors.filter((visitor) =>
      visitor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visitor.identity_card.includes(searchQuery) ||
      visitor.phone.includes(searchQuery)
    );
    setFilteredVisitors(filtered);
    setCurrentPage(1);
  };

  const handleRegisterVisitor = async () => {
    const token = await AsyncStorage.getItem("token");
    const residentId = user?.resident?.id;

    try {
      await authApis(token).post(`${endpoints.residents}${residentId}/visitor/`, form);
      Alert.alert("Thành công", "Đã đăng ký khách thành công.");
      setModalVisible(false);
      setForm({ full_name: "", identity_card: "", phone: "", relationship_to_resident: "" });
      loadVisitors();
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể đăng ký khách.");
    }
  };

  const renderVisitor = ({ item }) => (
    <Card style={styles.card} elevation={3}>
      <Card.Content>
        <Text style={styles.name}>
          <Icon name="account" size={20} color="#4A4A4A" /> {item.full_name}
        </Text>
        <Text style={styles.info}>
          <Icon name="account-heart" size={18} color="#777" /> Quan hệ: {item.relationship_to_resident || "Không rõ"}
        </Text>
        <Text style={styles.info}>
          <Icon name="card-account-details-outline" size={18} color="#777" /> CCCD: {item.identity_card}
        </Text>
        <Text style={styles.info}>
          <Icon name="phone" size={18} color="#777" /> SĐT: {item.phone}
        </Text>
        <Text style={styles.info}>
          <Icon name="check-circle" size={18} color={item.is_approved ? "green" : "gray"} />{" "}
          {item.is_approved ? "Đã được duyệt" : "Chưa được duyệt"}
        </Text>

        {item.is_approved && item.parking_card ? (
          <View style={{ marginTop: 6 }}>
            <Text style={styles.info}>
              <Icon name="credit-card" size={18} color="#777" /> Số thẻ xe: {item.parking_card.card_number}
            </Text>
          </View>
        ) : null}
      </Card.Content>
    </Card>
  );

  const paginateVisitors = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredVisitors.slice(startIndex, endIndex);
  };

  const handleNextPage = () => {
    if (currentPage * itemsPerPage < filteredVisitors.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return <Text style={{ padding: 20 }}>Đang tải dữ liệu...</Text>;
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm khách"
        value={searchQuery}
        onChangeText={handleSearch}
      />

      {filteredVisitors.length === 0 ? (
        <Text style={styles.noData}>Không có khách nào được ghi nhận.</Text>
      ) : (
        <FlatList
          data={paginateVisitors()}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderVisitor}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListFooterComponent={
            <View style={styles.paginationContainer}>
              <TouchableOpacity onPress={handlePrevPage} style={[styles.pageButton, { opacity: currentPage === 1 ? 0.5 : 1 }]}>
                <Ionicons name="chevron-back-outline" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.pageInfo}>{`${currentPage} / ${Math.ceil(filteredVisitors.length / itemsPerPage)}`}</Text>
              <TouchableOpacity onPress={handleNextPage} style={[styles.pageButton, { opacity: currentPage === Math.ceil(filteredVisitors.length / itemsPerPage) ? 0.5 : 1 }]}>
                <Ionicons name="chevron-forward-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addText}>Đăng Ký Khách</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                setForm({
                  full_name: "",
                  identity_card: "",
                  phone: "",
                  relationship_to_resident: "",
                });
              }}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Đăng ký khách</Text>
            <TextInput
              placeholder="Họ tên"
              style={styles.input}
              value={form.full_name}
              onChangeText={(text) => setForm({ ...form, full_name: text })}
            />
            <TextInput
              placeholder="Số CCCD"
              style={styles.input}
              value={form.identity_card}
              onChangeText={(text) => setForm({ ...form, identity_card: text })}
            />
            <TextInput
              placeholder="Số điện thoại"
              style={styles.input}
              value={form.phone}
              onChangeText={(text) => setForm({ ...form, phone: text })}
            />
            <TextInput
              placeholder="Quan hệ với chủ hộ"
              style={styles.input}
              value={form.relationship_to_resident}
              onChangeText={(text) => setForm({ ...form, relationship_to_resident: text })}
            />

            <TouchableOpacity style={styles.modalButtons} onPress={handleRegisterVisitor}>
              <Text style={styles.saveButton}>Lưu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  card: { marginBottom: 12, borderRadius: 12, backgroundColor: "#fff" },
  name: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 6 },
  info: { fontSize: 15, color: "#555", marginTop: 2 },
  noData: { textAlign: "center", marginTop: 20, fontStyle: "italic", color: "#888" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContainer: { width: "90%", backgroundColor: "#fff", padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    fontSize: 16,
  },
  modalButtons: {
    marginTop: 20,
    backgroundColor: "#2ecc71",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: { color: "#fff", fontSize: 16, fontWeight: "bold", textAlign: "center" },
  closeButton: { position: "absolute", top: 10, right: 10, padding: 5 },
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
  addText: { color: "#fff", marginLeft: 5 },
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
  searchInput: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingLeft: 10,
  },
});

export default MyVisitors;
