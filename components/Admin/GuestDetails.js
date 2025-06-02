import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Button, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApis, endpoints } from "../../configs/Apis";

const GuestDetails = () => {
  const route = useRoute();
  const { guestId } = route.params;
  const [guest, setGuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vehicleType, setVehicleType] = useState('motorbike');
  const [licensePlate, setLicensePlate] = useState('');
  const [color, setColor] = useState('');

const generateNextCardNumber = (existingCards) => {
  const usedNumbers = existingCards
    .map(card => card.card_number ? parseInt(card.card_number.replace('N', '')) : NaN)
    .filter(num => !isNaN(num));

  if (usedNumbers.length === 0) return 'N001';

  const maxUsed = Math.max(...usedNumbers);
  const nextCardNumber = maxUsed + 1;

  return `N${nextCardNumber.toString().padStart(3, '0')}`;
};

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

  const issueParkingCard = async () => {
    if (!licensePlate.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập biển số xe.');
        return;
    }

    try {
        const token = await AsyncStorage.getItem('token');

        const resCards = await authApis(token).get(endpoints.parking_cards);
        const nextCardNumber = generateNextCardNumber(resCards.data);

        if (!nextCardNumber) {
        Alert.alert('Lỗi', 'Đã hết mã thẻ khả dụng.');
        return;
        }

        const formData = new FormData();
        formData.append('card_number', nextCardNumber);
        formData.append('vehicle_type', vehicleType);
        formData.append('license_plate', licensePlate);
        if (color.trim()) formData.append('color', color.trim());
        formData.append('visitor', guestId);

        const res = await authApis(token).post(endpoints.parking_cards, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        });

        Alert.alert('Thành công', `Đã cấp thẻ xe với số: ${nextCardNumber}`);
        setGuest(prev => ({ ...prev, parking_card: res.data }));
    } catch (error) {
        console.error('Lỗi khi cấp thẻ xe:', error);
        if (error.response) {

        console.error('Lỗi từ server:', error.response.data);
        }
        Alert.alert('Lỗi', 'Không thể cấp thẻ xe.');
    }
  };

  useEffect(() => {
    loadGuestDetails();
  }, [guestId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
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

        {guest.parking_card ? (
          <View style={styles.parkingCard}>
            <Text style={styles.label}>Thẻ xe:</Text>
            <Text style={styles.value}>Số thẻ: {guest.parking_card.card_number}</Text>
            <Text style={styles.value}>Khách: {guest.parking_card.visitor}</Text>
          </View>
        ) : (
          <View style={styles.parkingCard}>
            <Text style={styles.label}>Loại xe:</Text>
            <Picker selectedValue={vehicleType} onValueChange={setVehicleType}>
              <Picker.Item label="Xe máy" value="motorbike" />
              <Picker.Item label="Ô tô" value="car" />
              <Picker.Item label="Xe đạp" value="bike" />
              <Picker.Item label="Khác" value="Other" />
            </Picker>

            <TextInput
              placeholder="Biển số xe"
              value={licensePlate}
              onChangeText={setLicensePlate}
              style={styles.input}
            />

            <TextInput
              placeholder="Màu xe (tuỳ chọn)"
              value={color}
              onChangeText={setColor}
              style={styles.input}
            />

            <Button title="Cấp thẻ xe" onPress={issueParkingCard} />
          </View>
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
});

export default GuestDetails;
