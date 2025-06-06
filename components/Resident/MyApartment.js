import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { MyUserContext } from "../../configs/Contexts";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";

const quanHeVietHoa = {
    "owner": "Chủ hộ",
    "wife/husband": "Vợ/Chồng",
    "child": "Con cái",
    "other": "Khác"
};

const MyApartment = () => {
  const user = useContext(MyUserContext);
  const apartmentId = user.resident?.apartment;
  const [apartmentResidents, setApartmentResidents] = useState([]);
  const [apartment, setApartment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (apartmentId) fetchApartmentResidents();
  }, [apartmentId]);

  const fetchApartmentResidents = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).get(`${endpoints.apartments}${apartmentId}/residents/`);
      const aptRes = await authApis(token).get(`${endpoints.apartments}${apartmentId}`);
      
      setApartment(aptRes.data);
      setApartmentResidents(res.data);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin cư dân:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.residentCard}>
      <Text style={styles.residentName}>{item.name}</Text>
      <Text style={styles.residentDetails}>Mối quan hệ: {quanHeVietHoa[user.resident.relationship_to_head] || "Không rõ"}</Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#007bff" style={{ flex: 1, justifyContent: "center" }} />;
  }

  return (
    <View style={styles.container}>
      {apartment && (
        <View style={styles.apartmentInfo}>
            <Text style={styles.apartmentTitle}>Căn hộ: {apartment.number}</Text>
            <Text style={styles.apartmentDetails}>Diện tích: {apartment.area} m²</Text>
            <Text style={styles.apartmentDetails}>Giá: {apartment.price} VND</Text>
        </View>
      )}
      {apartmentResidents.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 20 }}>Không có cư dân nào trong căn hộ này.</Text>
      ) : (
        <FlatList
          data={apartmentResidents}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f2f2f2",
  },
  apartmentInfo: {
    marginBottom: 20,
    textAlign: "center",
  },
  apartmentTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
  },
  apartmentDetails: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  residentCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  residentName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  residentDetails: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
});

export default MyApartment;
