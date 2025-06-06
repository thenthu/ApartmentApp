import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Modal, Image, TextInput } from "react-native";
import { MyUserContext } from "../../configs/Contexts";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';

const MyInvoices = () => {
  const user = useContext(MyUserContext);
  const residentId = user.resident?.id;
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [proofImage, setProofImage] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const invoicesPerPage = 5;

  const navigation = useNavigation();

  useEffect(() => {
    if (residentId) fetchInvoices();
  }, [residentId]);

  const fetchInvoices = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).get(`${endpoints.residents}${residentId}/invoices/`);
      const unpaidInvoices = res.data.filter((invoice) => !invoice.is_paid);
      setInvoices(unpaidInvoices);
      setFilteredInvoices(unpaidInvoices);
      setTotalPages(Math.ceil(unpaidInvoices.length / invoicesPerPage));
    } catch (error) {
      console.error("Lỗi tải hóa đơn:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    const filtered = invoices.filter(invoice =>
      invoice.fee_type.name.toLowerCase().includes(text.toLowerCase()) ||
      invoice.is_paid.toString().includes(text.toLowerCase())
    );
    setFilteredInvoices(filtered);
    setTotalPages(Math.ceil(filtered.length / invoicesPerPage));
    setCurrentPage(1);  // Reset to the first page on search
  };

  const openQRCode = (invoice) => {
    setSelectedInvoice(invoice);
    setModalVisible(true);
  };

  const closeQRCode = () => {
    setModalVisible(false);
    setSelectedInvoice(null);
    setProofImage(null);
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString("vi-VN") + " VND";
  };

  const pickImage = async (invoice) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Bạn cần cấp quyền truy cập thư viện ảnh!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const selectedImage = result.assets[0];
      setSelectedInvoice(invoice);
      setModalVisible(true);
      setProofImage(selectedImage.uri);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!proofImage || !selectedInvoice) {
      alert("Vui lòng chọn ảnh minh chứng và hóa đơn!");
      return;
    }

    setPaymentLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");

      const fileType = mime.lookup(proofImage) || "image/jpeg";
      const fileExtension = fileType.split("/")[1] || "jpg";

      const formData = new FormData();
      formData.append("invoice_id", selectedInvoice.id);
      formData.append("method", "momo");
      formData.append("proof_image", {
        uri: Platform.OS === "android" ? proofImage : proofImage.replace("file://", ""),
        name: `proof_image.${fileExtension}`,
        type: fileType,
      });

      const res = await authApis(token).post(endpoints.payments, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Đã gửi minh chứng");
      setProofImage(null);
      closeQRCode();
    } catch (error) {
      console.error("Lỗi:", error.response?.data || error.message);
      alert("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>🧾 {item.fee_type.name}</Text>
      <Text style={styles.amount}>💵 {formatCurrency(item.amount)}</Text>
      <Text style={[styles.status, { color: item.is_paid ? "#28a745" : "#dc3545" }]}>{item.is_paid ? "Đã thanh toán" : "Chưa thanh toán"}</Text>

      <TouchableOpacity onPress={() => pickImage(item)} style={styles.proofButton}>
        <Text style={styles.proofButtonText}>Ảnh minh chứng</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => openQRCode(item)} style={styles.qrButton}>
        <Text style={styles.qrButtonText}>Xem Mã QR</Text>
      </TouchableOpacity>
    </View>
  );

  const currentInvoices = filteredInvoices.slice((currentPage - 1) * invoicesPerPage, currentPage * invoicesPerPage);

  if (loading) {
    return <ActivityIndicator size="large" color="#007bff" style={{ flex: 1, justifyContent: "center" }} />;
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm hóa đơn"
        value={searchQuery}
        onChangeText={handleSearch}
      />

      <TouchableOpacity onPress={() => navigation.navigate('MyInvoiceHistory')}>
        <Text style={styles.historyLink}>Xem lịch sử thanh toán</Text>
      </TouchableOpacity>

      {invoices.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 20 }}>Không có hóa đơn nào.</Text>
      ) : (
        <FlatList 
        data={currentInvoices} 
        keyExtractor={(item) => item.id.toString()} 
        renderItem={renderItem}
        ListFooterComponent={
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              onPress={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={[styles.pageButton, { opacity: currentPage === 1 ? 0.5 : 1 }]}
            >
              <Ionicons name="chevron-back-outline" size={24} color="white" />
            </TouchableOpacity>

            <Text style={styles.pageInfo}>
              {currentPage} / {totalPages}
            </Text>

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

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {!proofImage ? (
              <View>
                <Text style={styles.modalTitle}>Mã QR của Ban Quản Lý</Text>
                <Image source={require("../../assets/qr.jpg")} style={styles.qrImage} />
              </View>
            ) : (
              <View>
                <Image source={{ uri: proofImage }} style={styles.proofImage} />
                <TouchableOpacity onPress={handlePaymentSubmit} style={styles.submitButton}>
                  {paymentLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitButtonText}>Gửi</Text>}
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={closeQRCode} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
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
    backgroundColor: "#f2f2f2",
  },
  searchInput: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingLeft: 10,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  pageButton: {
    backgroundColor: "#007bff",
    padding: 8,
    borderRadius: 5,
  },
  pageInfo: {
    marginHorizontal: 12,
    fontSize: 16,
    color: "#333",
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
  title: { fontSize: 16, fontWeight: "600", color: "#333" },
  amount: { fontSize: 16, fontWeight: "bold", color: "#007bff", marginVertical: 5 },
  status: { fontSize: 14, fontWeight: "bold", marginTop: 5 },
  proofButton: {
    marginTop: 8,
    backgroundColor: "#007bff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  proofButtonText: { color: "#fff", fontWeight: "bold" },
  qrButton: {
    marginTop: 8,
    backgroundColor: "#28a745",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  qrButtonText: { color: "#fff", fontWeight: "bold" },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  qrImage: {
    width: 200,
    height: 200,
    marginBottom: 12,
  },
  proofImage: {
    width: 200,
    height: 200,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    width: "100%",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 8,
  },
  historyLink: {
    color: "#007bff",
    textAlign: "right",
    padding: 7,
    textDecorationLine: "underline",
    fontSize: 16,
  },
});

export default MyInvoices;
