import { useEffect, useState } from 'react';
import { View, FlatList, Alert, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, Text, Modal, Portal, Provider } from 'react-native-paper';
import { authApis, endpoints } from "../../configs/Apis";
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from "@expo/vector-icons";

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [residents, setResident] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [titleText, setTitleText] = useState("");
  const [responseText, setResponseText] = useState("");
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(3);
  const [searchText, setSearchText] = useState("");

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      const [complaintsRes, residentsRes] = await Promise.all([ 
        authApis(token).get(endpoints.complaints),
        authApis(token).get(endpoints.residents),
      ]);

      const residentMap = residentsRes.data.reduce((acc, res) => {
        acc[res.id] = res.name;
        return acc;
      }, {});

      const enrichedComplaints = complaintsRes.data.map((complaint) => ({
        ...complaint,
        resident_name: residentMap[complaint.resident] || 'Không rõ',
      }));

      enrichedComplaints.sort(
        (a, b) => new Date(b.create_time) - new Date(a.create_time)
      );

      setComplaints(enrichedComplaints);
      setResident(residentsRes.data);
    } catch (error) {
      console.error('Lỗi khi tải phản ánh:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách phản ánh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleResolve = (complaint) => {
    setSelectedComplaint(complaint);
    setModalVisible(true);
    console.log("Selected Complaint ID:", selectedComplaint?.id);
  };

  const handleSubmitResponse = async () => {
    if (responseText.trim()) {
      const responseData = {
        title: titleText,
        resonder: "1",
        content: responseText,
      };

      const resolvedData = {
        status: "resolved",
        is_resolved: true,
      };

      try {
        const token = await AsyncStorage.getItem('token');
        await authApis(token).post(`/complaints/${selectedComplaint.id}/complaintresponses/`, responseData);
        await authApis(token).patch(`/complaints/${selectedComplaint.id}/`, resolvedData);
        Alert.alert("Thông báo", "Phản hồi của bạn đã được gửi.");
        setModalVisible(false);
        setResponseText("");
      } catch (error) {
        console.error('Lỗi khi gửi phản hồi:', error);
        Alert.alert("Lỗi", "Không thể gửi phản hồi.");
      }
    } else {
      Alert.alert("Lỗi", "Vui lòng nhập phản hồi.");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderComplaint = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.title}>{item.title}</Text>
        <Text style={styles.text}>Cư dân: {item.resident_name}</Text>
        <Text style={styles.statusText}>Trạng thái: {item.is_resolved ? 'Đã xử lý' : 'Chờ xử lý'}</Text>
        <Text style={styles.date}>
          Ngày tạo: {new Date(item.create_time).toLocaleString()}
        </Text>
        {!item.is_resolved && (
          <TouchableOpacity 
            onPress={() => handleResolve(item)} 
            style={styles.resolveButton}
          >
            <Text style={styles.resolveButtonText}>Xử lý</Text>
          </TouchableOpacity>
        )}
      </Card.Content>
    </Card>
  );

  const filteredComplaints = complaints.filter((complaint) => {
    const searchString = searchText.toLowerCase();
    return (
      complaint.title.toLowerCase().includes(searchString) || 
      complaint.resident_name.toLowerCase().includes(searchString)
    );
  });

  const currentComplaints = filteredComplaints.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <Text style={{ padding: 20 }}>Đang tải dữ liệu...</Text>;
  }

  return (
    <Provider>
      <View style={styles.container}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm phản ánh..."
          value={searchText}
          onChangeText={setSearchText}
        />

        <TouchableOpacity 
          onPress={() => navigation.navigate('ComplaintHistory', { complaints, residents })}
          style={styles.historyToggleText}
        >
          <Text style={styles.historyText}>Lịch sử phản ánh</Text>
        </TouchableOpacity>

        <FlatList
          data={currentComplaints.filter(c => !c.is_resolved)}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderComplaint}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListFooterComponent={
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                onPress={handlePreviousPage}
                disabled={currentPage === 1}
                style={[styles.pageButton, { opacity: currentPage === 1 ? 0.5 : 1 }]}
              >
              <Ionicons name="chevron-back-outline" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.pageInfo}>{currentPage} / {totalPages}</Text>
              <TouchableOpacity
                onPress={handleNextPage}
                disabled={currentPage === totalPages}
                style={[styles.pageButton, { opacity: currentPage === 1 ? 0.5 : 1 }]}
              >
                <Ionicons name="chevron-forward-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          }
        />

        <Portal>
          <Modal visible={modalVisible} contentContainerStyle={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                setTitleText("");
                setResponseText("");
              }}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Phản hồi cho phản ánh</Text>

            <TextInput
              style={styles.textInput}
              placeholder="Tiêu đề phản hồi"
              value={titleText}
              onChangeText={setTitleText}
            />

            <TextInput
              style={styles.textInput}
              multiline
              placeholder="Viết phản hồi của bạn ở đây"
              value={responseText}
              onChangeText={setResponseText}
            />
            <TouchableOpacity style={styles.modalButtons} onPress={handleSubmitResponse}>
              <Text style={styles.saveButton}>Gửi phản hồi</Text>
            </TouchableOpacity>
          </Modal>
        </Portal>
      </View>
    </Provider>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f4f4f9',
    padding: 16,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 5,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF0000',
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  resolveButton: {
    backgroundColor: "#2ecc71",
    alignSelf: "flex-end",
    marginTop: 10,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resolveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
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
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  textInput: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  modalButtons: {
    marginTop: 20,
    backgroundColor: "#2ecc71",
    paddingVertical: 12,
    borderRadius: 10,
    alignSelf: "center",
    alignItems: "center",
    width: 100,
  },
  saveButton: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold" ,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 5,
  },
  historyToggleText: {
    textAlign: 'right',
    marginBottom: 10,
    alignSelf: "flex-end",
  },
  historyText: {
    color: '#3498db',
    fontSize: 16,
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
};

export default Complaints;
