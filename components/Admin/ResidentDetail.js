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
  const [parkingCard, setParkingCard] = useState(null);

  const loadResidentDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).get(`${endpoints["residents"]}${residentId}/`);
      setResident(res.data);

      try {
        const cardRes = await authApis(token).get(`${endpoints["residents"]}${residentId}/parkingcard/`);
        setParkingCard(cardRes.data);
      } catch (cardErr) {
        if (cardErr.response?.status === 500) {
          setParkingCard(null);
        } else {
          console.error("Lỗi khi lấy thẻ xe:", cardErr);
        }
      }
            
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
    return <Text style={{ padding: 20 }}>Đang tải dữ liệu...</Text>;
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

      {parkingCard ? (
        <Card style={styles.card}>
          <Card.Title title="Thông tin thẻ xe" titleStyle={styles.cardTitle} />
          <Card.Content>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Mã thẻ:</Text>
              <Text style={styles.value}>{parkingCard.card_number}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Loại xe:</Text>
              <Text style={styles.value}>
                {parkingCard.vehicle_type === "car" ? "Ô tô" : "Xe máy"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Biển số:</Text>
              <Text style={styles.value}>
                {parkingCard.license_plate || "Không có"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Màu xe:</Text>
              <Text style={styles.value}>{parkingCard.color || "Không có"}</Text>
            </View>
          </Card.Content>
        </Card>
      ) : (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.noCardText}>Cư dân chưa có thẻ xe</Text>
          </Card.Content>
        </Card>
      )}

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
  cardTitle: {
  fontSize: 18,
  fontWeight: "bold",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontWeight: "600",
    color: "#555",
  },
  value: {
    fontWeight: "400",
    color: "#000",
  },
  noCardText: {
    textAlign: "center",
    fontStyle: "italic",
    color: "#999",
    paddingVertical: 10,
    fontSize: 16,
  }
});

export default ResidentDetails;
