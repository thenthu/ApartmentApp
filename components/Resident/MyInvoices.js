import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Modal, Image } from "react-native";
import { MyUserContext } from "../../configs/Contexts";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MyInvoices = () => {
  const user = useContext(MyUserContext);
  const residentId = user.resident?.id;
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    if (residentId) fetchInvoices();
  }, [residentId]);

  const fetchInvoices = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).get(`${endpoints.residents}${residentId}/invoices/`);
      setInvoices(res.data);
    } catch (error) {
      console.error("Lỗi tải hóa đơn:", error);
    } finally {
      setLoading(false);
    }
  };

  const openQRCode = (invoice) => {
    setSelectedInvoice(invoice);
    setModalVisible(true);
  };

  const closeQRCode = () => {
    setModalVisible(false);
    setSelectedInvoice(null);
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString("vi-VN") + " VND";
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openQRCode(item)}>
      <Text style={styles.title}>🧾 {item.fee_type.name}</Text>
      <Text style={styles.amount}>💵 {formatCurrency(item.amount)}</Text>
      <Text style={[styles.status, { color: item.is_paid ? "#28a745" : "#dc3545" }]}>
        {item.is_paid ? "Đã thanh toán" : "Chưa thanh toán"}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#007bff" style={{ flex: 1, justifyContent: "center" }} />
    );
  }

  return (
    <View style={styles.container}>
      {invoices.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 20 }}>Không có hóa đơn nào.</Text>
      ) : (
        <FlatList data={invoices} keyExtractor={(item) => item.id.toString()} renderItem={renderItem} />
      )}

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mã QR của Ban Quản Lý</Text>
            <Image source={require("../../assets/qr.jpg")} style={styles.qrImage} />
            <TouchableOpacity onPress={closeQRCode} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  modalContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "rgba(0,0,0,0.5)" 
  },

  modalContent: { 
    backgroundColor: "#fff", 
    padding: 20, 
    borderRadius: 10, 
    alignItems: "center" 
  },

  modalTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginBottom: 10 
  },

  qrImage: { 
    width: 200, 
    height: 200 
  },

  closeButton: { 
    marginTop: 15, 
    padding: 10, 
    backgroundColor: "#007bff", 
    borderRadius: 8 
  },

  closeButtonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold" 
  }
});

export default MyInvoices;
