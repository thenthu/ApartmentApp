import React, { useEffect, useState } from 'react';
import { View, FlatList, Alert, TextInput, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useRoute } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApis } from "../../configs/Apis";
import Ionicons from 'react-native-vector-icons/Ionicons';

const ComplaintHistory = () => {
  const [loading, setLoading] = useState(true);
  const [detailedComplaints, setDetailedComplaints] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(3);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const route = useRoute();
  const { complaints, residents } = route.params;

  const residentMap = residents.reduce((acc, res) => {
    acc[res.id] = res.name;
    return acc;
  }, {});

  const loadDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const resolved = complaints.filter(c => c.is_resolved);

      const startIdx = (currentPage - 1) * itemsPerPage;
      const endIdx = currentPage * itemsPerPage;
      const currentPageComplaints = resolved.slice(startIdx, endIdx);

      const enriched = await Promise.all(
        currentPageComplaints.map(async (c) => {
          try {
            const res = await authApis(token).get(`/complaints/${c.id}/`);
            return {
              ...c,
              resident_name: residentMap[c.resident] || 'Không rõ',
              responses: res.data.responses || [],
            };
          } catch (err) {
            console.error(`Lỗi khi tải complaint ${c.id}:`, err);
            return {
              ...c,
              resident_name: residentMap[c.resident] || 'Không rõ',
              responses: [],
            };
          }
        })
      );

      const sorted = enriched.sort(
        (a, b) => new Date(b.create_time) - new Date(a.create_time)
      );

      setDetailedComplaints(sorted);
      setHasMore(enriched.length > 0);
      setTotalPages(Math.ceil(resolved.length / itemsPerPage));
    } catch (err) {
      console.error("Lỗi khi tải phản ánh:", err);
      Alert.alert("Lỗi", "Không thể tải phản ánh.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const filterComplaints = (complaints) => {
    return complaints.filter((complaint) =>
      complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.resident_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prevPage => prevPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadDetails();
  }, [currentPage]);

  const renderComplaint = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.text}>Cư dân: {item.resident_name}</Text>
        <Text style={styles.status}>Trạng thái: Đã xử lý</Text>
        <Text style={styles.date}>Ngày tạo: {new Date(item.create_time).toLocaleString()}</Text>

        <View style={{ marginTop: 10 }}>
          <Text style={{ fontWeight: 'bold' }}>Phản hồi:</Text>
          {item.responses.length > 0 ? (
            item.responses.map((r, index) => (
              <Text key={index} style={{ marginLeft: 10 }}>• {r.content}</Text>
            ))
          ) : (
            <Text style={{ marginLeft: 10, fontStyle: 'italic' }}>Chưa có phản hồi.</Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return <Text style={{ padding: 20 }}>Đang tải dữ liệu...</Text>;
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm phản ánh..."
        value={searchQuery}
        onChangeText={handleSearch}
      />

      <FlatList
        data={filterComplaints(detailedComplaints)}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderComplaint}
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
              style={[styles.pageButton, { opacity: currentPage === totalPages ? 0.5 : 1 }]}
            >
              <Ionicons name="chevron-forward-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  card: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 3,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  status: {
    fontSize: 16,
    color: '#28a745',
    fontWeight: '500',
  },
  date: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    marginBottom: 16,
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
};

export default ComplaintHistory;
