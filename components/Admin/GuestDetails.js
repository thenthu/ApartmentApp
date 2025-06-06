import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApis, endpoints } from "../../configs/Apis";

const GuestDetails = () => {
  const route = useRoute();
  const { guestId } = route.params;
  const [guest, setGuest] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadGuestDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await authApis(token).get(`${endpoints.visitors}/${guestId}/`);
      setGuest(res.data);
    } catch (error) {
      console.error('Lỗi khi tải thông tin khách:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin khách.');
    } finally {
      setLoading(false);
    }
  };

  const approveGuest = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await authApis(token).patch(
        `${endpoints.visitors}/${guestId}/`,
        { is_approved: 1 }
      );

      if (res.status === 200) {
        Alert.alert('Thành công', 'Khách đã được phê duyệt.');
        setGuest(prev => ({ ...prev, is_approved: 1 }));
      } else {
        Alert.alert('Lỗi', 'Không thể phê duyệt khách.');
      }
    } catch (error) {
      console.error('Lỗi khi phê duyệt khách:', error);
      Alert.alert('Lỗi', 'Không thể phê duyệt khách.');
    }
  };

  useEffect(() => {
    loadGuestDetails();
  }, [guestId]);

  if (loading) {
    return <Text style={{ padding: 20 }}>Đang tải dữ liệu...</Text>;
  }

  if (!guest) {
    return (
      <View style={styles.center}>
        <Text>Không tìm thấy thông tin khách.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Cư dân: <Text style={styles.value}>{guest.resident.name}</Text></Text>
          <Text style={styles.header}>Phòng: <Text style={styles.value}>{guest.resident.apartment?.number}</Text></Text>
        </View>

        <Text style={styles.label}>Họ và tên: <Text style={styles.value}>{guest.full_name}</Text></Text>
        <Text style={styles.label}>Mối quan hệ với cư dân: <Text style={styles.value}>{guest.relationship_to_resident}</Text></Text>
        <Text style={styles.label}>Số CMND: <Text style={styles.value}>{guest.identity_card}</Text></Text>
        <Text style={styles.label}>Số điện thoại: <Text style={styles.value}>{guest.phone}</Text></Text>

        {guest.is_approved ? (
          <Text style={styles.label}>Khách đã được phê duyệt</Text>
        ) : (
          <TouchableOpacity style={styles.approveButton} onPress={approveGuest}>
            <Text style={styles.approveButtonText}>Phê duyệt</Text>
          </TouchableOpacity>
        )}

        {guest.parking_card ? (
          <View style={styles.parkingCard}>
            <Text style={styles.label}>Thẻ xe:</Text>
            <Text style={styles.value}>Số thẻ: {guest.parking_card.card_number}</Text>
            <Text style={styles.value}>Khách: {guest.parking_card.visitor}</Text>
          </View>
        ) : (
          <Text>Khách chưa có thẻ xe.</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  value: {
    fontWeight: 'normal',
  },
  parkingCard: {
    marginTop: 16,
    padding: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
  },
  approveButton: {
    backgroundColor: '#4a90e2', // Màu nền của nút
    paddingVertical: 12, // Khoảng cách theo chiều dọc
    paddingHorizontal: 20, // Khoảng cách theo chiều ngang
    borderRadius: 8, // Bo góc nút
    alignItems: 'center', // Căn giữa chữ trong nút
    marginTop: 20, // Khoảng cách với các phần tử trên
    elevation: 3, // Bóng đổ nhẹ
  },
  approveButtonText: {
    color: '#fff', // Màu chữ
    fontSize: 16, // Kích thước chữ
    fontWeight: 'bold', // Đậm chữ
  },
});

export default GuestDetails;
