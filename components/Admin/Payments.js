import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { Card, Modal, Portal, Button, Provider } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { Ionicons } from "@expo/vector-icons";
import RNPickerSelect from "react-native-picker-select";
import DateTimePicker from "@react-native-community/datetimepicker";

const feeTypes = [
  { label: "Phí giữ xe", value: 1 },
  { label: "Phí dịch vụ quản lí", value: 2 },
  { label: "Phí bảo trì hệ thống", value: 3 },
  { label: "Tiền điện", value: 4 },
  { label: "Tiền nước", value: 5 },
];

const Payments = () => {
  const [groupedInvoices, setGroupedInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [residents, setResidents] = useState([]);
  const [newInvoice, setNewInvoice] = useState({
    resident: "",
    fee_type: "",
    amount: "",
    due_date: new Date(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofData, setProofData] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (searchText) {
      const filtered = groupedInvoices.filter((group) =>
        group.title.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredInvoices(filtered);
    } else {
      setFilteredInvoices(groupedInvoices);
    }
  }, [searchText, groupedInvoices]);

  const fetchInvoices = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const [invoiceRes, residentRes] = await Promise.all([
        authApis(token).get(endpoints.invoices),
        authApis(token).get(endpoints.residents),
      ]);

      const residents = residentRes.data;
      setResidents(residents);

      const invoicesWithNames = invoiceRes.data.map((inv) => {
        const resident = residents.find((r) => r.id === inv.resident);
        return {
          ...inv,
          residentName: resident ? resident.name : "Không rõ",
        };
      });

      const grouped = invoicesWithNames.reduce((acc, invoice) => {
        const group = acc.find((g) => g.title === invoice.residentName);
        if (group) {
          group.data.push(invoice);
        } else {
          acc.push({
            title: invoice.residentName,
            data: [invoice],
          });
        }
        return acc;
      }, []);

      grouped.sort((a, b) => a.title.localeCompare(b.title));

      setGroupedInvoices(grouped);
      setFilteredInvoices(grouped);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProof = async () => {
    if (!selectedPayment) return;
    try {
      const token = await AsyncStorage.getItem("token");
      console.log(selectedPayment.invoice.fee_type);
      await authApis(token).post(`${endpoints.payments}${selectedPayment.id}/approve/`, {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resident: selectedPayment.resident,
          fee_type_id: selectedPayment.invoice.fee_type.id,
          amount: selectedPayment.amount,
        }),
      });

      alert('Duyệt thành công');
      closeProofModal();
      fetchInvoices();
    } catch (error) {
      alert('Lỗi khi duyệt');
      console.error(error);
    }
  };

  const handleRejectProof = async () => {
    if (!proofData || !proofData.invoice) return;

    try {
      const token = await AsyncStorage.getItem("token");
      console.log(selectedPayment.invoice.fee_type);
      await authApis(token).post(`${endpoints.payments}${selectedPayment.id}/reject/`, {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resident: selectedPayment.resident,
          fee_type_id: selectedPayment.invoice.fee_type.id,
          amount: selectedPayment.amount,
        }),
      });

      alert("Từ chối thành công");
      closeProofModal();
      fetchPayments();
    } catch (error) {
      console.error("Reject error:", error);
      alert("Lỗi khi từ chối minh chứng");
    }
  };

  const formatDate = (date) => {
    if (!(date instanceof Date)) {
      return "";
    }
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleAddInvoice = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const dueDate = new Date(newInvoice.due_date);
      const dueDateString = dueDate.getFullYear() + '-' 
                          + ('0' + (dueDate.getMonth() + 1)).slice(-2) + '-'
                          + ('0' + dueDate.getDate()).slice(-2);

      await authApis(token).post(endpoints.invoices, {
        resident: newInvoice.resident,
        fee_type_id: newInvoice.fee_type,
        amount: parseFloat(newInvoice.amount),
        due_date: dueDateString,
      });

      closeModal();
      fetchInvoices();
    } catch (error) {
      console.error("Lỗi khi thêm hóa đơn:", error.response ? error.response.data : error.message);
    }
  };

  const openModal = () => setShowModal(true);
  const closeModal = () => {
    setShowModal(false);
    setNewInvoice({ resident: "", fee_type: "", amount: "", due_date: new Date() });
  };

  const handleViewProof = async (invoiceId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await authApis(token).get(endpoints.payments);

      const payment = response.data.find(payment => payment.invoice.id === invoiceId);
      if (payment) {
        setProofData(payment);
        setShowProofModal(true);
        setSelectedPayment(payment);
      } else {
        console.error("Không tìm thấy minh chứng cho hóa đơn này.");
      }
    } catch (error) {
      console.error("Lỗi khi lấy minh chứng:", error.message);
    }
  };

  const closeProofModal = () => {
    setShowProofModal(false);
    setProofData(null);
  };

  const renderItem = ({ item }) => {
    return (
      <Card style={styles.card} key={item.id}>
        <Card.Title
          title={`🧾 ${item.fee_type ? item.fee_type.name : "Không rõ"}`}
          subtitle={`💵 ${item.amount.toLocaleString("vi-VN")}0 VND`}
          titleStyle={styles.cardTitle}
          subtitleStyle={styles.cardAmount}
          right={() => (
            <Text
              style={[styles.status, { color: item.is_paid ? "#28a745" : "#dc3545" }]}
            >
              {item.paid ? "Đã thanh toán" : "Chưa thanh toán"}
            </Text>
          )}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleViewProof(item.id)}
        >
          <Text style={styles.viewProofText}>Xem Minh Chứng</Text>
        </TouchableOpacity>
      </Card>
    );
  };

  const handleSearch = (text) => setSearchText(text);

  const paginateData = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const nextPage = () => {
    if (filteredInvoices.length > currentPage * itemsPerPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return <Text style={{ padding: 20 }}>Đang tải dữ liệu...</Text>;
  }

  const paginatedInvoices = paginateData(filteredInvoices);

  return (
    <Provider>
      <View style={styles.container}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm hóa đơn..."
          value={searchText}
          onChangeText={handleSearch}
        />
        {filteredInvoices.length === 0 ? (
          <Text style={styles.emptyText}>Không có hóa đơn nào.</Text>
        ) : (
          <FlatList
            data={paginatedInvoices}
            keyExtractor={(item) => item.title}
            renderItem={({ item }) => (
              <>
                <Text style={styles.sectionHeader}>👤 {item.title}</Text>
                {item.data.map((invoice) => renderItem({ item: invoice }))}
              </>
            )}
            ListFooterComponent={
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  onPress={prevPage}
                  disabled={currentPage === 1}
                  style={[styles.pageButton, { opacity: currentPage === 1 ? 0.5 : 1 }]}
                >
                  <Ionicons name="chevron-back-outline" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.pageNumber}>
                  {currentPage} / {Math.ceil(filteredInvoices.length / itemsPerPage)}
                </Text>
                <TouchableOpacity
                  onPress={nextPage}
                  disabled={currentPage === Math.ceil(filteredInvoices.length / itemsPerPage)}
                  style={[styles.pageButton, {
                    opacity:
                      currentPage === Math.ceil(filteredInvoices.length / itemsPerPage)
                        ? 0.5
                        : 1,
                  }]}
                >
                  <Ionicons name="chevron-forward-outline" size={24} color="white" />
                </TouchableOpacity>
              </View>
            }
          />
        )}

        <TouchableOpacity style={styles.addButton} onPress={openModal}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addText}>Thêm Hóa Đơn</Text>
        </TouchableOpacity>

        <Portal>
          <Modal
            visible={showModal}
            onDismiss={closeModal}
            contentContainerStyle={styles.modalContainer}
          >
            <TouchableOpacity style={styles.closeButton} onPress={() => closeModal()}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Thêm Hóa Đơn</Text>

            <RNPickerSelect
              onValueChange={(value) => setNewInvoice({ ...newInvoice, resident: value })}
              placeholder={{ label: "Chọn cư dân", value: null }}
              items={residents.map((r) => ({
                label: r.name,
                value: r.id,
              }))}
              style={pickerSelectStyles}
              value={newInvoice.resident}
            />

            <RNPickerSelect
              onValueChange={(value) => setNewInvoice({ ...newInvoice, fee_type: value })}
              placeholder={{ label: "Chọn loại phí", value: null }}
              items={feeTypes}
              style={pickerSelectStyles}
              value={newInvoice.fee_type}
            />

            <TextInput
              style={styles.searchInput}
              placeholder="Số tiền (Nghìn VND)"
              keyboardType="numeric"
              value={newInvoice.amount}
              onChangeText={(text) => setNewInvoice({ ...newInvoice, amount: text })}
            />

            <View style={styles.dateContainer}>
              <Text style={styles.label}>Ngày đến hạn: </Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
                <Text style={styles.dateText}>{formatDate(newInvoice.due_date)}</Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={newInvoice.due_date}
                  mode="date"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setNewInvoice({ ...newInvoice, due_date: new Date(selectedDate) });
                    }
                    setShowDatePicker(false);
                  }}
                />
              )}
            </View>


            <TouchableOpacity style={styles.modalButtons} onPress={handleAddInvoice}>
              <Text style={styles.saveButton}>Lưu</Text>
            </TouchableOpacity>

          </Modal>
        </Portal>

        <Portal>
          <Modal
            visible={showProofModal}
            onDismiss={closeProofModal}
            contentContainerStyle={styles.modalContainer}
          >
            <TouchableOpacity style={styles.closeButton} onPress={closeProofModal}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Minh Chứng Thanh Toán</Text>

            {proofData ? (
              <>
                <Text style={styles.modalContent}>Mã Hóa Đơn: {proofData.invoice.fee_type.name}</Text>
                <Text style={styles.modalContent}>Số Tiền: {proofData.invoice.amount.toLocaleString("vi-VN")} VND</Text>
                <Text style={styles.modalContent}>Ngày Thanh Toán: {formatDate(new Date(proofData.create_time))}</Text>
                <Text style={styles.modalContent}>Phương Thức Thanh Toán: {proofData.method}</Text>
                <Image
                  source={{ uri: proofData.proof_image }}
                  style={{ width: 320, height: 320, resizeMode: 'contain', marginTop: 10 }}
                />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                  <Button
                    mode="contained"
                    onPress={handleApproveProof}
                    style={{ marginRight: 8, backgroundColor: '#2196F3' }}
                  >
                    Duyệt
                  </Button>

                  <Button
                    mode="outlined"
                    onPress={handleRejectProof}
                    style={{ marginLeft: 8, borderColor: '#F44336' }}
                    labelStyle={{ color: '#F44336' }}
                  >
                    Từ chối
                  </Button>
                </View>
              </>
            ) : (
              <Text style={styles.modalContent}>Không có minh chứng.</Text>
            )}
          </Modal>
        </Portal>
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f2f2f2",
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "bold",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 10,
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginVertical: 6,
    paddingHorizontal: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  cardAmount: {
    fontSize: 14,
    fontWeight: "500",
    color: "#007bff",
    marginTop: 4,
    lineHeight: 20,
  },
  status: {
    fontSize: 14,
    fontWeight: "bold",
    alignSelf: "center",
    marginRight: 16,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
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
  pageNumber: {
    fontSize: 16,
    marginHorizontal: 10,
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
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 10,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  modalButtons: {
    marginTop: 20,
    backgroundColor: "#2ecc71",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    width: 100,
    justifyContent: "center",
    width: "100%",
  },
  saveButton: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold",
    alignSelf: "center",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 5,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 12, 
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  viewProofText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalContent: {
    fontSize: 16,
    marginBottom: 10,
    color: "#333",
  },
});

const pickerSelectStyles = {
  inputAndroid: {
    fontSize: 16,
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 15,
  },
};

export default Payments;
