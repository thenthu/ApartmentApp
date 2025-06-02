import React, { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, Alert, TextInput, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, Text, Modal, Portal, Provider } from 'react-native-paper';
import { authApis, endpoints } from "../../configs/Apis";

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [responseText, setResponseText] = useState("");

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
    } catch (error) {
      console.error('Lỗi khi tải phản ánh:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách phản ánh.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = (complaint) => {
    setSelectedComplaint(complaint);
    setModalVisible(true);
  };

  const handleSubmitResponse = () => {
    if (responseText.trim()) {
      Alert.alert("Thông báo", "Phản hồi của bạn đã được gửi.");
      setModalVisible(false);
      setResponseText("");
    } else {
      Alert.alert("Lỗi", "Vui lòng nhập phản hồi.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
            <Text style={styles.resolveButtonText}>Đã xử lý</Text>
          </TouchableOpacity>
        )}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Provider>
      <View style={styles.container}>
        <FlatList
          data={complaints}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderComplaint}
        />
        <Portal>
          <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modalContainer}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeText}>X</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Phản hồi cho phản ánh</Text>
            <TextInput
              style={styles.textInput}
              multiline
              placeholder="Viết phản hồi của bạn ở đây"
              value={responseText}
              onChangeText={setResponseText}
            />
            <TouchableOpacity 
              onPress={handleSubmitResponse} 
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>Gửi phản hồi</Text>
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
    color: '#00796b',
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resolveButton: {
    backgroundColor: "#3498db",
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
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 2,
    right: 3,
    borderRadius: 50,
    padding: 8,
  },
  closeText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
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
  submitButton: {
    backgroundColor: '#00796b',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
};

export default Complaints;
