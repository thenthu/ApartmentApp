import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { Ionicons } from "@expo/vector-icons";
import RNPickerSelect from "react-native-picker-select";

const ParkingCards = () => {
  const [parkingCards, setParkingCards] = useState({
    residentsCards: [],
    visitorsCards: [],
  });
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);
  const [residents, setResidents] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newCard, setNewCard] = useState({
    residentId: "",
    cardNumber: "",
    licensePlate: "",
    vehicleType: "car",
    color: "",
  });

  const vehicleTypeLabels = {
    motorbike: "Xe máy",
    car: "Ô tô",
    bike: "Xe đạp",
    Other: "Khác",
  };

  useEffect(() => {
    loadParkingCards();
    loadResidents();
  }, []);

  const loadParkingCards = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const [parkingCardsRes, visitorsRes] = await Promise.all([
        authApis(token).get(endpoints.parking_cards),
        authApis(token).get(endpoints.visitors),
      ]);

      setVisitors(visitorsRes.data);

      const parkingCardsWithNames = parkingCardsRes.data.map((card) => {
        const visitor = card.visitor
          ? visitors.find((v) => v.id === card.visitor)
          : null;
        return {
          ...card,
          visitorName: visitor ? visitor.full_name : "Không rõ",
        };
      });

      const residentsCards = parkingCardsWithNames.filter((card) => card.resident);
      const visitorsCards = parkingCardsWithNames.filter((card) => card.visitor);

      setParkingCards({ residentsCards, visitorsCards });
    } catch (error) {
      console.error("Lỗi khi tải thẻ xe và khách:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadResidents = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).get(endpoints.residents);
      setResidents(res.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách cư dân:", error);
    }
  };
  
  const filteredVisitors = visitors.filter((visitor) => {
    return visitor.parking_card === null && visitor.is_approved === true;
  });

  const generateNextCardNumber = (existingCards) => {
    const usedNumbers = existingCards
      .map((card) => (card.card_number ? parseInt(card.card_number.replace("N", "")) : NaN))
      .filter((num) => !isNaN(num));

    if (usedNumbers.length === 0) return "N001";

    const maxUsed = Math.max(...usedNumbers);
    const nextCardNumber = maxUsed + 1;

    return `N${nextCardNumber.toString().padStart(3, "0")}`;
  };

  const handleSectionPress = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Title title={`Thẻ xe ${item.card_number}`} titleStyle={styles.cardTitle} />
      <Text style={styles.cardDetailText}>{`Biển số: ${item.license_plate}`}</Text>
      <Text style={styles.cardDetailText}>{`Loại xe: ${vehicleTypeLabels[item.vehicle_type]}`}</Text>
      <Text style={styles.cardDetailText}>{`Màu sắc: ${item.color}`}</Text>
      <Text style={styles.residentText}>
        {item.resident
          ? `Cư dân: ${residents.find((resident) => resident.id === item.resident)?.name || "Không rõ"}`
          : item.visitorName
          ? `Khách: ${item.visitorName}`
          : "Chưa có cư dân/khách"}
      </Text>
    </Card>
  );

  const handleSubmit = async () => {
    const { residentId, visitorId, licensePlate, color, vehicleType } = newCard;

    if (!residentId && !visitorId) {
      Alert.alert("Lỗi", "Vui lòng chọn cư dân hoặc khách.");
      return;
    }

    if (!licensePlate.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập biển số xe.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const resCards = await authApis(token).get(endpoints.parking_cards);
      const nextCardNumber = generateNextCardNumber(resCards.data);

      if (!nextCardNumber) {
        Alert.alert("Lỗi", "Không thể tạo mã thẻ mới.");
        return;
      }

      const formData = new FormData();
      formData.append("card_number", nextCardNumber);
      formData.append("vehicle_type", vehicleType);
      formData.append("license_plate", licensePlate.trim());
      if (color.trim()) formData.append("color", color.trim());
      formData.append("resident", residentId || null);
      formData.append("visitor", visitorId || null);

      await authApis(token).post(endpoints.parking_cards, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await loadParkingCards();

      setNewCard({
        residentId: "",
        visitorId: "",
        cardNumber: "",
        licensePlate: "",
        vehicleType: "car",
        color: "",
      });
      setShowForm(false);
    } catch (error) {
      console.error("Lỗi khi cấp thẻ xe:", error);
      Alert.alert("Lỗi", "Không thể cấp thẻ xe.");
    }
  };

  if (loading) {
    return <Text style={{ padding: 20 }}>Đang tải dữ liệu...</Text>;
  }

  return (
    <View style={styles.container}>
      {parkingCards.residentsCards.length === 0 && parkingCards.visitorsCards.length === 0 ? (
        <Text style={styles.emptyText}>Không có thẻ xe nào.</Text>
      ) : (
        <>
          {parkingCards.residentsCards.length > 0 && (
            <>
              <TouchableOpacity
                onPress={() => handleSectionPress("residents")}
                style={styles.sectionHeader}
              >
                <Text style={styles.sectionTitle}>Cư dân</Text>
              </TouchableOpacity>
              {expandedSection === "residents" && (
                <FlatList
                  data={parkingCards.residentsCards}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderItem}
                />
              )}
            </>
          )}

          {parkingCards.visitorsCards.length > 0 && (
            <>
              <TouchableOpacity
                onPress={() => handleSectionPress("visitors")}
                style={styles.sectionHeader}
              >
                <Text style={styles.sectionTitle}>Khách</Text>
              </TouchableOpacity>
              {expandedSection === "visitors" && (
                <FlatList
                  data={parkingCards.visitorsCards}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderItem}
                />
              )}
            </>
          )}
        </>
      )}

      <Modal
        visible={showForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.formContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowForm(false);
                setNewCard({
                    residentId: "",
                    cardNumber: "",
                    licensePlate: "",
                    vehicleType: "car",
                    color: "",
                });
                }}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.formTitle}>Cấp Thẻ Xe</Text>
            <RNPickerSelect
              onValueChange={(value) => setNewCard({ ...newCard, residentId: value })}
              items={residents.map((r) => ({
                label: `${r.name}`,
                value: r.id,
              }))}
              placeholder={{ label: "Chọn cư dân...", value: null }}
              style={{
                inputIOS: styles.input,
                inputAndroid: styles.input,
              }}
              value={newCard.residentId}
            />
            <RNPickerSelect
              onValueChange={(value) => setNewCard({ ...newCard, visitorId: value })}
              items={filteredVisitors.map((v) => ({
                label: `${v.full_name}`,
                value: v.id,
              }))}
              placeholder={{ label: "Chọn khách...", value: null }}
              style={{
                inputIOS: styles.input,
                inputAndroid: styles.input,
              }}
              value={newCard.visitorId}
            />
            <TextInput
              style={styles.input}
              placeholder="Biển số"
              value={newCard.licensePlate}
              onChangeText={(text) => setNewCard({ ...newCard, licensePlate: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Màu sắc"
              value={newCard.color}
              onChangeText={(text) => setNewCard({ ...newCard, color: text })}
            />
            <Text style={{ marginBottom: 6, color: "#333" }}>Loại xe:</Text>
            <RNPickerSelect
              onValueChange={(value) => setNewCard({ ...newCard, vehicleType: value })}
              items={[
                { label: "Ô tô", value: "car" },
                { label: "Xe máy", value: "motorbike" },
                { label: "Xe đạp", value: "bike" },
                { label: "Khác", value: "other" },
              ]}
              placeholder={{ label: "Chọn loại xe...", value: null }}
              style={{
                inputIOS: styles.input,
                inputAndroid: styles.input,
              }}
              value={newCard.vehicleType}
            />

            <TouchableOpacity style={styles.modalButtons} onPress={handleSubmit}>
              <Text style={styles.saveButton}>Cấp thẻ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {!showForm && (
        <TouchableOpacity onPress={() => setShowForm(true)} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addText}>Thêm Thẻ Xe Cư Dân</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f7f9fc" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    elevation: 4,
    padding: 16,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 8 },
  cardDetailText: { fontSize: 15, color: "#555", marginBottom: 6, lineHeight: 22 },
  residentText: { fontSize: 15, color: "#666", marginTop: 12, fontStyle: "italic" },
  sectionHeader: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#f0f0f0",
    marginBottom: 8,
    borderRadius: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { textAlign: "center", fontSize: 16, color: "#999", marginTop: 20 },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 10,
    alignItems: "stretch",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  modalButtons: {
    marginTop: 20,
    backgroundColor: "#2ecc71",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButton: { 
    color: "#fff", 
    ontSize: 16, 
    fontWeight: "bold" 
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
  addText: { color: "#fff", marginLeft: 5 },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
});

export default ParkingCards;
