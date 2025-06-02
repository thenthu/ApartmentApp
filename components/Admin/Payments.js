import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";

const Payments = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).get(endpoints.invoices);
      setInvoices(res.data);
    } catch (error) {
      console.error("Lỗi khi tải hóa đơn:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Title
        title={`🧾 ${item.fee_type.name}`}
        subtitle={`💵 ${item.amount.toLocaleString("vi-VN")} VND`}
        titleStyle={styles.cardTitle}
        subtitleStyle={styles.cardAmount}
        right={() => (
          <Text style={[styles.status, { color: item.is_paid ? "#28a745" : "#dc3545" }]}>
            {item.is_paid ? "Đã thanh toán" : "Chưa thanh toán"}
          </Text>
        )}
      />
    </Card>
  );

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#007bff" style={{ flex: 1, justifyContent: "center" }} />
    );
  }

  return (
    <View style={styles.container}>
      {invoices.length === 0 ? (
        <Text style={styles.emptyText}>Không có hóa đơn nào.</Text>
      ) : (
        <FlatList
          data={invoices}
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
    backgroundColor: "#f2f2f2" 
  },

  title: { 
    fontSize: 20, 
    fontWeight: "bold", 
    marginBottom: 10, 
    color: "#333" 
  },

  card: { 
    backgroundColor: "#fff", 
    borderRadius: 10, 
    marginBottom: 12, 
    shadowColor: "#000", 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 2 
  },

  cardTitle: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#333" 
  },

  cardAmount: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#007bff", 
    marginTop: 2 
  },

  status: { 
    fontSize: 14, 
    fontWeight: "bold", 
    alignSelf: "center", 
    marginRight: 16 
  },

  emptyText: {
    textAlign: "center", 
    marginTop: 20, 
    fontSize: 16, 
    color: "#666"
  }
});

export default Payments;
