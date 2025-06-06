import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableWithoutFeedback, TextInput, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { authApis, endpoints } from "../../configs/Apis";

const Guests = ({ navigation }) => {
  const [groupedGuests, setGroupedGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const ITEMS_PER_PAGE = 3;
  const [page, setPage] = useState(1);
  const [visibleGuests, setVisibleGuests] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [searchText, setSearchText] = useState('');

  const loadGuestsByResidents = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const resResidents = await authApis(token).get(endpoints.residents);
      const residents = resResidents.data;

      const guestGroups = [];

      for (const resident of residents) {
        try {

          const apartmentId = resident.apartment;
          let apartmentNumber = "Không rõ";
          
          if (apartmentId) {
            const resApartment = await authApis(token).get(`${endpoints.apartments}/${apartmentId}`);
            apartmentNumber = resApartment.data.number;
          }

          const resVisitors = await authApis(token).get(`${endpoints.residents}${resident.id}/visitors/`);
          const visitors = resVisitors.data;

          if (visitors.length > 0) {
            guestGroups.push({
              residentName: resident.name,
              apartmentNumber: apartmentNumber,
              guests: visitors,
            });
          }
        } catch (err) {
          console.error(`Lỗi khi lấy visitors của cư dân ${resident.id}`, err);
        }
      }

      guestGroups.sort((a, b) => {
        const numA = parseInt(a.apartmentNumber);
        const numB = parseInt(b.apartmentNumber);

        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }

        return a.apartmentNumber.localeCompare(b.apartmentNumber);
      });

      setGroupedGuests(guestGroups);
      setPage(1);
      setVisibleGuests(guestGroups.slice(0, ITEMS_PER_PAGE));
      setTotalPages(Math.ceil(guestGroups.length / ITEMS_PER_PAGE));
    } catch (err) {
      console.error('Lỗi khi tải danh sách khách:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const goToNextPage = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      setVisibleGuests(groupedGuests.slice((nextPage - 1) * ITEMS_PER_PAGE, nextPage * ITEMS_PER_PAGE));
    }
  };

  const goToPrevPage = () => {
    if (page > 1) {
      const prevPage = page - 1;
      setPage(prevPage);
      setVisibleGuests(groupedGuests.slice((prevPage - 1) * ITEMS_PER_PAGE, prevPage * ITEMS_PER_PAGE));
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGuestsByResidents();
  };

  const renderGroup = ({ item }) => (
    <View style={styles.groupContainer}>
      <Text style={styles.residentTitle}>
        🏠 {item.apartmentNumber} - {item.residentName}
      </Text>
      {item.guests.map((guest) => (
        <TouchableWithoutFeedback
          key={guest.id}
          onPress={() => navigation.navigate('GuestDetails', { guestId: guest.id })}
        >
          <Card style={styles.cardContainer}>
            <Card.Content>
              <Text style={styles.name}>👤 {guest.full_name}</Text>
              <Text>🧾 Mối quan hệ: {guest.relationship_to_resident}</Text>
            </Card.Content>
          </Card>
        </TouchableWithoutFeedback>
      ))}
    </View>
  );

  useEffect(() => {
    loadGuestsByResidents();
  }, []);

  if (loading) {
    return <Text style={{ padding: 20 }}>Đang tải dữ liệu...</Text>;
  }

  const filteredGuests = groupedGuests.filter((group) => {
    return group.residentName.toLowerCase().includes(searchText.toLowerCase()) ||
      group.apartmentNumber.includes(searchText);
  });

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm khách..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <FlatList
        data={filteredGuests.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderGroup}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Không có khách nào được đăng ký.</Text>
        }
        ListFooterComponent={
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              onPress={goToPrevPage}
              disabled={page === 1}
              style={[styles.pageButton, { opacity: page === 1 ? 0.5 : 1 }]}>
              <Ionicons name="chevron-back-outline" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.pageInfo}>{page} / {totalPages}</Text>
            <TouchableOpacity
              onPress={goToNextPage}
              disabled={page === totalPages}
              style={[styles.pageButton, { opacity: page === totalPages ? 0.5 : 1 }]}>
              <Ionicons name="chevron-forward-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  searchContainer: {
    margin: 16,
    marginBottom: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  groupContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  residentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 8,
  },
  cardContainer: {
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  pageButton: {
    padding: 10,
    backgroundColor: '#4a90e2',
    borderRadius: 5,
    marginHorizontal: 8,
  },
  pageInfo: {
    fontSize: 16,
    color: "#333",
  },
});

export default Guests;
