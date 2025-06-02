import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableWithoutFeedback } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from 'react-native-paper';
import { authApis, endpoints } from "../../configs/Apis";

const Guests = ({ navigation }) => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const parseRoomNumber = (room) => {
    const match = room?.match(/^([A-Za-z]*)(\d+)$/);
    if (match) {
      const prefix = match[1];
      const number = parseInt(match[2]);
      return [prefix, number];
    }
    return ['', 0];
  };

  const loadVisitors = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await authApis(token).get(endpoints.visitors);

      const sortedGuests = res.data.sort((a, b) => {
        const roomA = a.resident.apartment?.number || '';
        const roomB = b.resident.apartment?.number || '';
        const [prefixA, numberA] = parseRoomNumber(roomA);
        const [prefixB, numberB] = parseRoomNumber(roomB);

        const prefixCompare = prefixA.localeCompare(prefixB);
        if (prefixCompare !== 0) return prefixCompare;
        return numberA - numberB;
      });

      setGuests(sortedGuests);
    } catch (err) {
      console.error('Lỗi khi tải khách:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVisitors();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadVisitors();
  };

  const renderItem = ({ item }) => (
    <TouchableWithoutFeedback
      onPress={() => navigation.navigate('GuestDetails', { guestId: item.id })}
    >
      <Card style={styles.cardContainer}>
        <Card.Content>
          <Text style={styles.roomResident}>
            🏠 {item.resident.apartment?.number} - {item.resident.name}
          </Text>
          <Text style={styles.name}>👤 {item.full_name}</Text>
          <Text>🧾 Mối quan hệ: {item.relationship_to_resident}</Text>
        </Card.Content>
      </Card>
    </TouchableWithoutFeedback>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  return (
    <FlatList
      data={guests}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={guests.length === 0 && styles.center}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={<Text style={styles.empty}>Không có khách nào được đăng ký.</Text>}
    />
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cardContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  roomResident: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 6,
    color: '#333',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  empty: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default Guests;
