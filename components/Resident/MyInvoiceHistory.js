import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { MyUserContext } from "../../configs/Contexts";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MyInvoiceHistory = () => {
  const user = useContext(MyUserContext);
  const residentId = user.resident?.id;
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (residentId) fetchInvoiceHistory();
  }, [residentId]);

  const fetchInvoiceHistory = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).get(`${endpoints.residents}${residentId}/invoices/`);

      const paidInvoices = res.data.filter((invoice) => invoice.is_paid);
      setInvoices(paidInvoices);
    } catch (error) {
      console.error("Lỗi tải hóa đơn:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString("vi-VN") + " VND";
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>🧾 {item.fee_type.name}</Text>
      <Text style={styles.amount}>💵 {formatCurrency(item.amount)}</Text>
      <Text style={[styles.status, { color: "#28a745" }]}>Đã thanh toán</Text>
    </View>
  );

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#007bff" style={{ flex: 1, justifyContent: "center" }} />
    );
  }

  return (
    <View style={styles.container}>
      {invoices.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 20 }}>Không có hóa đơn đã thanh toán.</Text>
      ) : (
        <FlatList data={invoices} keyExtractor={(item) => item.id.toString()} renderItem={renderItem} />
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

  card: { 
    backgroundColor: "#fff", 
    borderRadius: 10, 
    padding: 16, 
    marginBottom: 12, 
    shadowColor: "#000", 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 2 
  },

  title: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#333" 
  },

  amount: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#007bff", 
    marginVertical: 5 
  },

  status: { 
    fontSize: 14, 
    fontWeight: "bold", 
    marginTop: 5 
  },
});

export default MyInvoiceHistory;
